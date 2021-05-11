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
   * @param agileInstance - An instance of Agile
   * @param initialValue - Initial Value of State
   * @param config - Config
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
   * @public
   * Set Key/Name of State
   */
  public set key(value: StateKey | undefined) {
    this.setKey(value);
  }

  /**
   * @public
   * Get Key/Name of State
   */
  public get key(): StateKey | undefined {
    return this._key;
  }

  //=========================================================================================================
  // Set Key
  //=========================================================================================================
  /**
   * @internal
   * Updates Key/Name of State
   * @param value - New Key/Name of State
   */
  public setKey(value: StateKey | undefined): this {
    const oldKey = this._key;

    // Update State Key
    this._key = value;

    // Update Key in Observer
    this.observer._key = value;

    // Update Key in Persistent (only if oldKey equal to persistentKey -> otherwise the PersistentKey got formatted and will be set where other)
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
      const message = `Incorrect type (${typeof _value}) was provided.`;
      if (!config.force) {
        Agile.logger.error(message);
        return this;
      }
      Agile.logger.warn(message);
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
      Agile.logger.warn(
        `'${type}' is not supported! Supported types: String, Boolean, Array, Object, Number`
      );
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
      Agile.logger.error(
        "You can't use the patch method on a non object based States!"
      );
      return this;
    }

    if (!isValidObject(targetWithChanges, true)) {
      Agile.logger.error('TargetWithChanges has to be an Object!');
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
      Agile.logger.error(
        'A Watcher Callback Function has to be typeof Function!'
      );
      return this;
    }

    // Check if watcherKey is already occupied
    if (this.watchers[key]) {
      Agile.logger.error(
        `Watcher Callback Function with the key/name '${key}' already exists!`
      );
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

    if (this.persistent) {
      Agile.logger.warn(
        `By persisting the State '${this._key}' twice you overwrite the old Persistent Instance!`,
        this.persistent
      );
    }

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
    if (!this.persistent) {
      Agile.logger.error(
        `Please make sure you persist the State '${this._key}' before using the 'onLoad' function!`
      );
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
    if (this.currentInterval) {
      Agile.logger.warn(
        `You can only have one interval active!`,
        this.currentInterval
      );
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
      Agile.logger.error(`A 'computeExistsMethod' has to be a function!`);
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
      Agile.logger.error('You can only invert boolean based States!');
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
      Agile.logger.error(`A 'computeValueMethod' has to be a function!`);
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
      Agile.logger.error('A sideEffect function has to be a function!');
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
