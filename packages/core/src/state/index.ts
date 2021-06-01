import {
  Agile,
  StorageKey,
  copy,
  defineConfig,
  flatMerge,
  isValidObject,
  StateObserver,
  StatePersistent,
  Observer,
  equal,
  isFunction,
  notEqual,
  generateId,
  PersistentKey,
  ComputedTracker,
  StateIngestConfigInterface,
  removeProperties,
  LogCodeManager,
} from '../internal';

export class State<ValueType = any> {
  public agileInstance: () => Agile;

  public _key?: StateKey;
  public valueType?: string; // primitive Type of State Value (for JS users)
  public isSet = false; // If value is not the same as initialValue
  public isPlaceholder = false;
  public initialStateValue: ValueType;
  public _value: ValueType; // Current Value of State
  public previousStateValue: ValueType;
  public nextStateValue: ValueType; // Represents the next Value of the State (mostly used internal)

  public observer: StateObserver<ValueType>; // Handles deps and subs of State and is like an interface to the Runtime
  public sideEffects: {
    [key: string]: SideEffectInterface<State<ValueType>>;
  } = {}; // SideEffects of State (will be executed in Runtime)
  public computeValueMethod?: ComputeValueMethod<ValueType>;
  public computeExistsMethod: ComputeExistsMethod<ValueType>;

  public isPersisted = false; // If State can be stored in Agile Storage (-> successfully integrated persistent)
  public persistent: StatePersistent | undefined; // Manages storing State Value into Storage

  public watchers: { [key: string]: StateWatcherCallback<ValueType> } = {};

  public currentInterval?: NodeJS.Timer | number;

  /**
   * @public
   * State - Class that holds one Value and causes rerender on subscribed Components
   *
   * @param agileInstance - An instance of Agile
   *
   * @param initialValue - Initial Value of State
   *
   * @param config - Configuration
   *
   * @typeparam ValueType - Type of a the value the State represents
   */
  constructor(
    agileInstance: Agile,
    initialValue: ValueType,
    config: StateConfigInterface = {}
  ) {
    config = defineConfig(config, {
      dependents: [],
      isPlaceholder: false,
    });
    this.agileInstance = () => agileInstance;
    this._key = config.key;
    this.observer = new StateObserver<ValueType>(this, {
      key: config.key,
      dependents: config.dependents,
    });
    this.initialStateValue = copy(initialValue);
    this._value = copy(initialValue);
    this.previousStateValue = copy(initialValue);
    this.nextStateValue = copy(initialValue);
    this.isPlaceholder = true;
    this.computeExistsMethod = (v) => {
      return v != null;
    };

    // Initial Set
    if (!config.isPlaceholder) this.set(initialValue, { overwrite: true });
  }

  /**
   * @public
   * Set Value of State
   */
  public set value(value: ValueType) {
    this.set(value);
  }

  /**
   * @public
   * Get Value of State
   */
  public get value(): ValueType {
    ComputedTracker.tracked(this.observer);
    return this._value;
  }

  /**
   * Updates key/name identifier of State.
   *
   * @public
   * @param value - New key/name identifier.
   */
  public set key(value: StateKey | undefined) {
    this.setKey(value);
  }

  /**
   * Returns key/name identifier of State.
   *
   * @public
   */
  public get key(): StateKey | undefined {
    return this._key;
  }

  /**
   * Updates key/name identifier of State.
   *
   * @public
   * @param value - New key/name identifier.
   */
  public setKey(value: StateKey | undefined): this {
    const oldKey = this._key;

    // Update State key
    this._key = value;

    // Update key in Observer
    this.observer._key = value;

    // Update key in Persistent (only if oldKey equal to persistentKey
    // because otherwise the persistentKey is detached from the State key
    // -> not managed by State anymore)
    if (value && this.persistent?._key === oldKey)
      this.persistent?.setKey(value);

    return this;
  }

  //=========================================================================================================
  // Set
  //=========================================================================================================
  /**
   * @public
   * Updates Value of State
   * @param value - new State Value
   * @param config - Config
   */
  public set(
    value: ValueType | ((value: ValueType) => ValueType),
    config: StateIngestConfigInterface = {}
  ): this {
    config = defineConfig(config, {
      force: false,
    });
    const _value = isFunction(value)
      ? (value as any)(copy(this._value))
      : value;

    // Check value has correct Type (js)
    if (!this.hasCorrectType(_value)) {
      LogCodeManager.log(config.force ? '14:02:00' : '14:03:00', [
        typeof _value,
        this.valueType,
      ]);
      if (!config.force) return this;
    }

    // Ingest new value into Runtime
    this.observer.ingestValue(_value, config);

    return this;
  }

  //=========================================================================================================
  // Ingest
  //=========================================================================================================
  /**
   * @internal
   * Ingests nextStateValue, computedValue into Runtime
   * @param config - Config
   */
  public ingest(config: StateIngestConfigInterface = {}): this {
    this.observer.ingest(config);
    return this;
  }

  //=========================================================================================================
  // Type
  //=========================================================================================================
  /**
   * @public
   * Assign primitive type to State Value
   * Note: This function is mainly thought for JS users
   * @param type - wished Type ('String', 'Boolean', 'Array', 'Object', 'Number')
   */
  public type(type: any): this {
    const supportedTypes = ['String', 'Boolean', 'Array', 'Object', 'Number'];

    // Check if type is a supported Type
    if (!supportedTypes.includes(type.name)) {
      LogCodeManager.log('14:03:01', [type]);
      return this;
    }

    this.valueType = type.name.toLowerCase();
    return this;
  }

  //=========================================================================================================
  // Undo
  //=========================================================================================================
  /**
   * @public
   * Undoes latest State Value change
   * @param config - Config
   */
  public undo(config: StateIngestConfigInterface = {}): this {
    this.set(this.previousStateValue, config);
    return this;
  }

  //=========================================================================================================
  // Reset
  //=========================================================================================================
  /**
   * @public
   * Resets State to its initial Value
   * @param config - Config
   */
  public reset(config: StateIngestConfigInterface = {}): this {
    this.set(this.initialStateValue, config);
    return this;
  }

  //=========================================================================================================
  // Patch
  //=========================================================================================================
  /**
   * @public
   * Patches Object with changes into State Value
   * Note: Only useful if State is an Object
   * @param targetWithChanges - Object that holds changes which get patched into State Value
   * @param config - Config
   */
  public patch(
    targetWithChanges: Object,
    config: PatchConfigInterface = {}
  ): this {
    config = defineConfig(config, {
      addNewProperties: true,
    });

    if (!isValidObject(this.nextStateValue, true)) {
      LogCodeManager.log('14:03:02');
      return this;
    }

    if (!isValidObject(targetWithChanges, true)) {
      LogCodeManager.log('00:03:01', ['TargetWithChanges', 'object']);
      return this;
    }

    // Merge targetWithChanges into nextStateValue
    this.nextStateValue = flatMerge<ValueType>(
      copy(this.nextStateValue),
      targetWithChanges,
      { addNewProperties: config.addNewProperties }
    );

    // Ingest updated nextStateValue into Runtime
    this.ingest(removeProperties(config, ['addNewProperties']));

    return this;
  }

  //=========================================================================================================
  // Watch
  //=========================================================================================================
  /**
   * @public
   * Watches State and detects State changes
   * @param callback - Callback Function that gets called if the State Value changes
   * @return Key of Watcher
   */
  public watch(callback: StateWatcherCallback<ValueType>): string;
  /**
   * @public
   * Watches State and detects State changes
   * @param key - Key/Name of Watcher Function
   * @param callback - Callback Function that gets called if the State Value changes
   */
  public watch(key: string, callback: StateWatcherCallback<ValueType>): this;
  public watch(
    keyOrCallback: string | StateWatcherCallback<ValueType>,
    callback?: StateWatcherCallback<ValueType>
  ): this | string {
    const generateKey = isFunction(keyOrCallback);
    let _callback: StateWatcherCallback<ValueType>;
    let key: string;

    if (generateKey) {
      key = generateId();
      _callback = keyOrCallback as StateWatcherCallback<ValueType>;
    } else {
      key = keyOrCallback as string;
      _callback = callback as StateWatcherCallback<ValueType>;
    }

    // Check if Callback is valid Function
    if (!isFunction(_callback)) {
      LogCodeManager.log('00:03:01', ['Watcher Callback', 'function']);
      return this;
    }

    // Check if watcherKey is already occupied
    if (this.watchers[key]) {
      LogCodeManager.log('14:03:03', [key]);
      return this;
    }

    this.watchers[key] = _callback;
    return generateKey ? key : this;
  }

  //=========================================================================================================
  // Remove Watcher
  //=========================================================================================================
  /**
   * @public
   * Removes Watcher at given Key
   * @param key - Key of Watcher that gets removed
   */
  public removeWatcher(key: string): this {
    delete this.watchers[key];
    return this;
  }

  /**
   * @public
   * Creates a Watcher that gets once called when the State Value changes for the first time and than destroys itself
   * @param callback - Callback Function that gets called if the State Value changes
   */
  public onInaugurated(callback: StateWatcherCallback<ValueType>): this {
    const watcherKey = 'InauguratedWatcherKey';
    this.watch(watcherKey, (value, key) => {
      callback(value, key);
      this.removeWatcher(watcherKey);
    });
    return this;
  }

  //=========================================================================================================
  // Has Watcher
  //=========================================================================================================
  /**
   * @public
   * Checks if watcher at given Key exists
   * @param key - Key/Name of Watcher
   */
  public hasWatcher(key: string): boolean {
    return !!this.watchers[key];
  }

  //=========================================================================================================
  // Persist
  //=========================================================================================================
  /**
   * @public
   * Stores State Value into Agile Storage permanently
   * @param config - Config
   */
  public persist(config?: StatePersistentConfigInterface): this;
  /**
   * @public
   * Stores State Value into Agile Storage permanently
   * @param key - Key/Name of created Persistent (Note: Key required if State has no set Key!)
   * @param config - Config
   */
  public persist(
    key?: PersistentKey,
    config?: StatePersistentConfigInterface
  ): this;
  public persist(
    keyOrConfig: PersistentKey | StatePersistentConfigInterface = {},
    config: StatePersistentConfigInterface = {}
  ): this {
    let _config: StatePersistentConfigInterface;
    let key: PersistentKey | undefined;

    if (isValidObject(keyOrConfig)) {
      _config = keyOrConfig as StatePersistentConfigInterface;
      key = this._key;
    } else {
      _config = config || {};
      key = keyOrConfig as PersistentKey;
    }

    _config = defineConfig(_config, {
      loadValue: true,
      storageKeys: [],
      defaultStorageKey: null,
    });

    // Check if State is already persisted
    if (this.persistent != null && this.isPersisted) return this;

    // Create persistent -> Persist Value
    this.persistent = new StatePersistent<ValueType>(this, {
      instantiate: _config.loadValue,
      storageKeys: _config.storageKeys,
      key: key,
      defaultStorageKey: _config.defaultStorageKey,
    });

    return this;
  }

  //=========================================================================================================
  // On Load
  //=========================================================================================================
  /**
   * @public
   * Callback Function that gets called if the persisted Value gets loaded into the State for the first Time
   * Note: Only useful for persisted States!
   * @param callback - Callback Function
   */
  public onLoad(callback: (success: boolean) => void): this {
    if (!this.persistent) return this;

    // Check if Callback is valid Function
    if (!isFunction(callback)) {
      LogCodeManager.log('00:03:01', ['OnLoad Callback', 'function']);
      return this;
    }

    this.persistent.onLoad = callback;

    // If State is already 'isPersisted' the loading was successful -> callback can be called
    if (this.isPersisted) callback(true);

    return this;
  }

  //=========================================================================================================
  // Interval
  //=========================================================================================================
  /**
   * @public
   * Calls callback at certain intervals in milliseconds and assigns the callback return value to the State
   * @param callback- Callback that is called on each interval and should return the new State value
   * @param ms - The intervals in milliseconds
   */
  public interval(
    callback: (value: ValueType) => ValueType,
    ms?: number
  ): this {
    if (!isFunction(callback)) {
      LogCodeManager.log('00:03:01', ['Interval Callback', 'function']);
      return this;
    }
    if (this.currentInterval) {
      LogCodeManager.log('14:03:04', [], this.currentInterval);
      return this;
    }

    this.currentInterval = setInterval(() => {
      this.set(callback(this._value));
    }, ms ?? 1000);

    return this;
  }

  //=========================================================================================================
  // Clear Interval
  //=========================================================================================================
  /**
   * @public
   * Clears the current Interval
   */
  public clearInterval(): void {
    if (this.currentInterval) {
      clearInterval(this.currentInterval as number);
      delete this.currentInterval;
    }
  }

  //=========================================================================================================
  // Copy
  //=========================================================================================================
  /**
   * @public
   * Creates fresh copy of State Value (-> No reference to State Value)
   */
  public copy(): ValueType {
    return copy(this.value);
  }

  //=========================================================================================================
  // Exists
  //=========================================================================================================
  /**
   * @public
   * Checks if State exists
   */
  public get exists(): boolean {
    return !this.isPlaceholder && this.computeExistsMethod(this.value);
  }

  //=========================================================================================================
  // Compute Exists
  //=========================================================================================================
  /**
   * @public
   * Function that computes the exists status of the State
   * @param method - Computed Function
   */
  public computeExists(method: ComputeExistsMethod<ValueType>): this {
    if (!isFunction(method)) {
      LogCodeManager.log('00:03:01', ['Compute Exists Method', 'function']);
      return this;
    }
    this.computeExistsMethod = method;

    return this;
  }

  //=========================================================================================================
  // Is
  //=========================================================================================================
  /**
   * @public
   * Equivalent to ===
   * @param value - Value that gets checked if its equals to the State Value
   */
  public is(value: ValueType): boolean {
    return equal(value, this.value);
  }

  //=========================================================================================================
  // Is Not
  //=========================================================================================================
  /**
   * @public
   * Equivalent to !==
   * @param value - Value that gets checked if its not equals to the State Value
   */
  public isNot(value: ValueType): boolean {
    return notEqual(value, this.value);
  }

  //=========================================================================================================
  // Invert
  //=========================================================================================================
  /**
   * @public
   * Inverts State Value
   * Note: Only useful with boolean based States
   */
  public invert(): this {
    if (typeof this._value === 'boolean') {
      this.set(!this._value as any);
    } else {
      LogCodeManager.log('14:03:05');
    }
    return this;
  }

  //=========================================================================================================
  // Compute Value
  //=========================================================================================================
  /**
   * @public
   * Function that recomputes State Value if it changes
   * @param method - Computed Function
   */
  public computeValue(method: ComputeValueMethod<ValueType>): this {
    if (!isFunction(method)) {
      LogCodeManager.log('00:03:01', ['Compute Value Method', 'function']);
      return this;
    }
    this.computeValueMethod = method;

    // Initial compute
    this.set(method(this.nextStateValue));

    return this;
  }

  //=========================================================================================================
  // Add SideEffect
  //=========================================================================================================
  /**
   * @internal
   * Adds SideEffect to State
   * @param key - Key/Name of SideEffect
   * @param callback - Callback Function that gets called on every State Value change
   * @param config - Config
   */
  public addSideEffect<Instance extends State<ValueType>>(
    key: string,
    callback: SideEffectFunctionType<Instance>,
    config: AddSideEffectConfigInterface = {}
  ): this {
    config = defineConfig(config, {
      weight: 10,
    });
    if (!isFunction(callback)) {
      LogCodeManager.log('00:03:01', ['Side Effect Callback', 'function']);
      return this;
    }
    this.sideEffects[key] = {
      callback: callback as any,
      weight: config.weight as any,
    };
    return this;
  }

  //=========================================================================================================
  // Remove SideEffect
  //=========================================================================================================
  /**
   * @internal
   * Removes SideEffect at given Key
   * @param key - Key of the SideEffect that gets removed
   */
  public removeSideEffect(key: string): this {
    delete this.sideEffects[key];
    return this;
  }

  //=========================================================================================================
  // Has SideEffect
  //=========================================================================================================
  /**
   * @internal
   * Checks if sideEffect at given Key exists
   * @param key - Key of SideEffect
   */
  public hasSideEffect(key: string): boolean {
    return !!this.sideEffects[key];
  }

  //=========================================================================================================
  // Is Correct Type
  //=========================================================================================================
  /**
   * @internal
   * Checks if Value has correct valueType (js)
   * Note: If no valueType set, it returns true
   * @param value - Value that gets checked for its correct Type
   */
  public hasCorrectType(value: any): boolean {
    if (!this.valueType) return true;
    const type = typeof value;
    return type === this.valueType;
  }

  //=========================================================================================================
  // Get Public Value
  //=========================================================================================================
  /**
   * @internal
   * Returns public Value of State
   */
  public getPublicValue(): ValueType {
    // If State Value is used internally and output represents the real state value (for instance in Group)
    if (this['output'] !== undefined) return this['output'];

    return this._value;
  }

  //=========================================================================================================
  // Get Persistable Value
  //=========================================================================================================
  /**
   * @internal
   * Returns Value that gets written into the Agile Storage
   */
  public getPersistableValue(): any {
    return this._value;
  }
}

export type StateKey = string | number;

/**
 * @param key - Key/Name of State
 * @param deps - Initial deps of State
 * @param isPlaceholder - If State is initially a Placeholder
 */
export interface StateConfigInterface {
  key?: StateKey;
  dependents?: Array<Observer>;
  isPlaceholder?: boolean;
}

/**
 * @param addNewProperties - If new Properties gets added to the State Value
 */
export interface PatchConfigInterface extends StateIngestConfigInterface {
  addNewProperties?: boolean;
}

/**
 * @param loadValue - If Persistent loads the persisted value into the State
 * @param storageKeys - Key/Name of Storages which gets used to persist the State Value (NOTE: If not passed the default Storage will be used)
 * @param defaultStorageKey - Default Storage Key (if not provided it takes the first index of storageKeys or the AgileTs default Storage)
 */
export interface StatePersistentConfigInterface {
  loadValue?: boolean;
  storageKeys?: StorageKey[];
  defaultStorageKey?: StorageKey;
}

export type StateWatcherCallback<T = any> = (value: T, key: string) => void;
export type ComputeValueMethod<T = any> = (value: T) => T;
export type ComputeExistsMethod<T = any> = (value: T) => boolean;

export type SideEffectFunctionType<Instance extends State<any>> = (
  instance: Instance,
  properties?: {
    [key: string]: any;
  }
) => void;

/**
 * @param callback - Callback Function that gets called on every State Value change
 * @param weight - When the sideEffect gets executed. The higher, the earlier it gets executed.
 */
export interface SideEffectInterface<Instance extends State<any>> {
  callback: SideEffectFunctionType<Instance>;
  weight: number;
}

/**
 * @param weight - When the sideEffect gets executed. The higher, the earlier it gets executed.
 */
export interface AddSideEffectConfigInterface {
  weight?: number;
}
