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
  public valueType?: string; // Primitive type which constrains the State value (for basic typesafety in Javascript)
  public isSet = false; // Whether the current value differs from the initial value
  public isPlaceholder = false;

  public initialStateValue: ValueType; // First value assigned to the State
  public _value: ValueType; // Current value of the State
  public previousStateValue: ValueType; // Previous value of the State
  public nextStateValue: ValueType; // Next value of the State (which can be used for dynamic State updates)

  // Handles dependencies to other States and subscriptions of UI-Components
  // and serves as an interface to the runtime
  public observer: StateObserver<ValueType>;
  public sideEffects: {
    [key: string]: SideEffectInterface<State<ValueType>>;
  } = {}; // Side effects of changing the State value
  public computeValueMethod?: ComputeValueMethod<ValueType>; // Method for dynamically computing the State value
  public computeExistsMethod: ComputeExistsMethod<ValueType>; // Method for dynamically computing the existence of the State

  public isPersisted = false; // Whether the State is persisted in an external Storage
  public persistent: StatePersistent | undefined; // Manages persisting the State value

  public watchers: { [key: string]: StateWatcherCallback<ValueType> } = {}; // Callbacks that are fired on State changes

  public currentInterval?: NodeJS.Timer | number; // The current active interval

  /**
   * A State manages a piece of Information
   * that we need to remember globally at a later point int time.
   * While providing a toolkit to use and mutate this set of Information.
   *
   * You can create as many global States as you need.
   *
   * @public
   * @param agileInstance - Instance of Agile the State belongs to.
   * @param initialValue - Initial value of State.
   * @param config - Configuration object
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

    // Set State value to specified initial value
    if (!config.isPlaceholder) this.set(initialValue, { overwrite: true });
  }

  /**
   * Updates the value of the State.
   *
   * [Learn more..](https://agile-ts.org/docs/core/state/properties#value)
   *
   * @public
   * @param value - New State value.
   */
  public set value(value: ValueType) {
    this.set(value);
  }

  /**
   * Returns a reference-free version of the State value.
   *
   * [Learn more..](https://agile-ts.org/docs/core/state/properties#value)
   *
   * @public
   */
  public get value(): ValueType {
    ComputedTracker.tracked(this.observer);
    return copy(this._value);
  }

  /**
   * Updates the key/name identifier of the State.
   *
   * [Learn more..](https://agile-ts.org/docs/core/state/properties#key)
   *
   * @public
   * @param value - New key/name identifier.
   */
  public set key(value: StateKey | undefined) {
    this.setKey(value);
  }

  /**
   * Returns the key/name identifier of the State.
   *
   * [Learn more..](https://agile-ts.org/docs/core/state/properties#key)
   *
   * @public
   */
  public get key(): StateKey | undefined {
    return this._key;
  }

  /**
   * Updates the key/name identifier of the State.
   *
   * [Learn more..](https://agile-ts.org/docs/core/state/methods/#setkey)
   *
   * @public
   * @param value - New key/name identifier.
   */
  public setKey(value: StateKey | undefined): this {
    const oldKey = this._key;

    // Update State key
    this._key = value;

    // Update key of Observer
    this.observer._key = value;

    // Update key in Persistent (only if oldKey equal to persistentKey
    // because otherwise the persistentKey is detached from the State key
    // -> not managed by State anymore)
    if (value && this.persistent?._key === oldKey)
      this.persistent?.setKey(value);

    return this;
  }

  /**
   * Assigns a new value to the State.
   *
   * [Learn more..](https://agile-ts.org/docs/core/state/methods/#set)
   *
   * @public
   * @param value - New State value
   * @param config - Configuration object
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

    // Check value has correct type (Javascript)
    if (!this.hasCorrectType(_value)) {
      LogCodeManager.log(config.force ? '14:02:00' : '14:03:00', [
        typeof _value,
        this.valueType,
      ]);
      if (!config.force) return this;
    }

    // Ingest the State with the new value into the runtime
    this.observer.ingestValue(_value, config);

    return this;
  }

  /**
   * Ingests the State without any specified new value into the runtime.
   *
   * Since no new value was defined either the State value is computed (Computed Class)
   * or the `nextStateValue` is taken.
   *
   * [Learn more..](https://agile-ts.org/docs/core/state/methods/#ingest)
   *
   * @internal
   * @param config - Configuration object
   */
  public ingest(config: StateIngestConfigInterface = {}): this {
    this.observer.ingest(config);
    return this;
  }

  /**
   * Assigns a primitive type to the State
   * which constrains the State value on the specified type
   * to ensure basic typesafety in Javascript.
   *
   * [Learn more..](https://agile-ts.org/docs/core/state/methods/#type)
   *
   * @public
   * @param type - Primitive type the State value must follow (`String`, `Boolean`, `Array`, `Object`, `Number`).
   */
  public type(type: any): this {
    const supportedTypes = ['String', 'Boolean', 'Array', 'Object', 'Number'];
    if (!supportedTypes.includes(type.name)) {
      LogCodeManager.log('14:03:01', [type]);
      return this;
    }
    this.valueType = type.name.toLowerCase();
    return this;
  }

  /**
   * Undoes the latest State value change.
   *
   * [Learn more..](https://agile-ts.org/docs/core/state/methods/#undo)
   *
   * @public
   * @param config - Configuration object
   */
  public undo(config: StateIngestConfigInterface = {}): this {
    this.set(this.previousStateValue, config);
    return this;
  }

  /**
   * Resets the State value to its initial value.
   *
   * [Learn more..](https://agile-ts.org/docs/core/state/methods/#reset)
   *
   * @public
   * @param config - Configuration object
   */
  public reset(config: StateIngestConfigInterface = {}): this {
    this.set(this.initialStateValue, config);
    return this;
  }

  /**
   * Merges the specified `targetWithChanges` object into the current State value.
   * This merge can be different for different value combinations:
   * - If the current State value is an `object`, it does partial update for the object.
   * - If the current State value is an `array` an the argument is an array too,
   *   it concatenates the current value with the value of the argument.
   * - If the current State value is not a `object` or an `array` it prints an warning.
   *
   * [Learn more..](https://agile-ts.org/docs/core/state/methods/#patch)
   *
   * @public
   * @param targetWithChanges - Object to be merged into the current State value.
   * @param config - Configuration object
   */
  public patch(
    targetWithChanges: Object,
    config: PatchConfigInterface = {}
  ): this {
    config = defineConfig(config, {
      addNewProperties: true,
    });

    // Check if the given conditions are suitable for a patch action
    if (!isValidObject(this.nextStateValue, true)) {
      LogCodeManager.log('14:03:02');
      return this;
    }
    if (!isValidObject(targetWithChanges, true)) {
      LogCodeManager.log('00:03:01', ['TargetWithChanges', 'object']);
      return this;
    }

    // Merge targetWithChanges object into the nextStateValue
    if (
      Array.isArray(targetWithChanges) &&
      Array.isArray(this.nextStateValue)
    ) {
      this.nextStateValue = [
        ...this.nextStateValue,
        ...targetWithChanges,
      ] as any;
    } else {
      this.nextStateValue = flatMerge<ValueType>(
        this.nextStateValue,
        targetWithChanges,
        { addNewProperties: config.addNewProperties }
      );
    }

    // Ingest updated 'nextStateValue' into runtime
    this.ingest(removeProperties(config, ['addNewProperties']));

    return this;
  }

  /**
   * Fires on each State value change.
   *
   * Returns the key/name identifier of the created watcher callback.
   *
   * [Learn more..](https://agile-ts.org/docs/core/state/methods/#watch)
   *
   * @public
   * @param callback - Callback function
   */
  public watch(callback: StateWatcherCallback<ValueType>): string;
  /**
   * Fires on each State value change.
   *
   * [Learn more..](https://agile-ts.org/docs/core/state/methods/#watch)
   *
   * @public
   * @param key - Key/Name identifier of the watcher callback.
   * @param callback - Callback function
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

    // Check if specified callback is a valid function
    if (!isFunction(_callback)) {
      LogCodeManager.log('00:03:01', ['Watcher Callback', 'function']);
      return this;
    }

    // Check if watcher with key is already occupied
    if (this.watchers[key]) {
      LogCodeManager.log('14:03:03', [key]);
      return this;
    }

    this.watchers[key] = _callback;
    return generateKey ? key : this;
  }

  /**
   * Removes a watcher callback with the specified key/name identifier from the State.
   *
   * [Learn more..](https://agile-ts.org/docs/core/state/methods/#removewatcher)
   *
   * @public
   * @param key - Key/Name identifier of the watcher callback to be removed.
   */
  public removeWatcher(key: string): this {
    delete this.watchers[key];
    return this;
  }

  /**
   * Returns a boolean indicating whether a watcher callback with the specified `key`
   * exists in the State or not.
   *
   * [Learn more..](https://agile-ts.org/docs/core/state/methods/#haswatcher)
   *
   * @public
   * @param key - Key/Name identifier of the watcher callback to be checked for existence.
   */
  public hasWatcher(key: string): boolean {
    return !!this.watchers[key];
  }

  /**
   * Fires on the first State value assignment and then destroys itself.
   *
   * [Learn more..](https://agile-ts.org/docs/core/state/methods/#oninaugurated)
   *
   * @public
   * @param callback - Callback function
   */
  public onInaugurated(callback: StateWatcherCallback<ValueType>): this {
    const watcherKey = 'InauguratedWatcherKey';
    this.watch(watcherKey, (value, key) => {
      callback(value, key);
      this.removeWatcher(watcherKey);
    });
    return this;
  }

  /**
   * Preserves the State `value` in the corresponding external Storage.
   *
   * The State key/name is used as the unique identifier for the Persistent.
   * If that is not desired or the State has no unique identifier,
   * please specify a separate unique identifier for the Persistent.
   *
   * [Learn more..](https://agile-ts.org/docs/core/state/methods/#persist)
   *
   * @public
   * @param config - Configuration object
   */
  public persist(config?: StatePersistentConfigInterface): this;
  /**
   * Preserves the State `value` in the corresponding external Storage.
   *
   * The specified key is used as the unique identifier for the Persistent.
   *
   * [Learn more..](https://agile-ts.org/docs/core/state/methods/#persist)
   *
   * @public
   * @param key - Key/Name identifier of Persistent.
   * @param config - Configuration object
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

    // Create Persistent (-> persist value)
    this.persistent = new StatePersistent<ValueType>(this, {
      instantiate: _config.loadValue,
      storageKeys: _config.storageKeys,
      key: key,
      defaultStorageKey: _config.defaultStorageKey,
    });

    return this;
  }

  /**
   * Fires immediately after the persisted `value`
   * is loaded into the State from corresponding the external Storage.
   *
   * Registering this callback only makes sense when the State is [persisted](https://agile-ts.org/docs/core/state/methods/#persist).
   *
   * [Learn more..](https://agile-ts.org/docs/core/state/methods/#onload)
   *
   * @public
   * @param callback - Callback function
   */
  public onLoad(callback: (success: boolean) => void): this {
    if (!this.persistent) return this;
    if (!isFunction(callback)) {
      LogCodeManager.log('00:03:01', ['OnLoad Callback', 'function']);
      return this;
    }

    // Register specified callback
    this.persistent.onLoad = callback;

    // If State is already persisted ('isPersisted') fire specified callback immediately
    if (this.isPersisted) callback(true);

    return this;
  }

  /**
   * Repeatedly calls a function or executes a code snippet,
   * with a fixed time delay between each call.
   *
   * [Learn more..](https://agile-ts.org/docs/core/state/methods/#interval)
   *
   * @public
   * @param handler - A function to be executed every delay milliseconds.
   * @param delay - The time, in milliseconds (thousandths of a second),
   * the timer should delay in between executions of the specified function.
   */
  public interval(
    handler: (value: ValueType) => ValueType,
    delay?: number
  ): this {
    if (!isFunction(handler)) {
      LogCodeManager.log('00:03:01', ['Interval Callback', 'function']);
      return this;
    }
    if (this.currentInterval) {
      LogCodeManager.log('14:03:04', [], this.currentInterval);
      return this;
    }

    // Create interval
    this.currentInterval = setInterval(() => {
      this.set(handler(this._value));
    }, delay ?? 1000);

    return this;
  }

  /**
   * Cancels a active timed, repeating action
   * which was previously established by a call to `interval()`.
   *
   * [Learn more..](https://agile-ts.org/docs/core/state/methods/#clearinterval)
   *
   * @public
   */
  public clearInterval(): void {
    if (this.currentInterval) {
      clearInterval(this.currentInterval as number);
      delete this.currentInterval;
    }
  }

  /**
   * Returns a boolean indicating whether the State exists.
   *
   * It calculates the value based on the `computeExistsMethod()`
   * and whether the State is a placeholder.
   *
   * [Learn more..](https://agile-ts.org/docs/core/state/methods/#exists)
   *
   * @public
   */
  public get exists(): boolean {
    return !this.isPlaceholder && this.computeExistsMethod(this.value);
  }

  /**
   * Defines the method used to compute the existence of the State.
   *
   * It is retrieved on each `exists()` method call
   * to determine whether the State exists or not.
   *
   * [Learn more..](https://agile-ts.org/docs/core/state/methods/#computeexists)
   *
   * @public
   * @param method - Method to compute the existence of the State.
   */
  public computeExists(method: ComputeExistsMethod<ValueType>): this {
    if (!isFunction(method)) {
      LogCodeManager.log('00:03:01', ['Compute Exists Method', 'function']);
      return this;
    }
    this.computeExistsMethod = method;

    return this;
  }

  /**
   * Defines the method used to compute the value of the State.
   *
   * It is retrieved on each State value change,
   * in order to compute the new State value
   * based on the specified compute method.
   *
   * [Learn more..](https://agile-ts.org/docs/core/state/methods/#computevalue)
   *
   * @public
   * @param method - Method to compute the value of the State.
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

  /**
   * Returns a boolean indicating whether the specified value is equal to the current State value.
   *
   * Equivalent to `===` with the difference that it looks at the value
   * and not on the reference in the case of objects.
   *
   * @public
   * @param value - Value to be compared with the current State value.
   */
  public is(value: ValueType): boolean {
    return equal(value, this.value);
  }

  /**
   * Returns a boolean indicating whether the specified value is not equal to the current State value.
   *
   * Equivalent to `!==` with the difference that it looks at the value
   * and not on the reference in the case of objects.
   *
   * @public
   * @param value - Value to be compared with the current State value.
   */
  public isNot(value: ValueType): boolean {
    return notEqual(value, this.value);
  }

  /**
   * Inverts the current State value.
   *
   * Some examples are:
   * - `'jeff'` -> `'ffej'`
   * - `true` -> `false`
   * - `[1, 2, 3]` -> `[3, 2, 1]`
   * - `10` -> `-10`
   *
   * @public
   */
  public invert(): this {
    switch (typeof this.nextStateValue) {
      case 'boolean':
        this.set(!this.nextStateValue as any);
        break;
      case 'object':
        if (Array.isArray(this.nextStateValue))
          this.set(this.nextStateValue.reverse() as any);
        break;
      case 'string':
        this.set(this.nextStateValue.split('').reverse().join('') as any);
        break;
      case 'number':
        this.set((this.nextStateValue * -1) as any);
        break;
      default:
        LogCodeManager.log('14:03:05', [typeof this.nextStateValue]);
    }

    return this;
  }

  /**
   *
   * Registers a `callback` function that is executed during the `runtime`
   * as a side effect of State changes.
   *
   * For example it is called when the State value changes from 'jeff' to 'hans'.
   *
   * A typical side effect could be the updating of the external Storage value.
   *
   * @internal
   * @param key - Key/Name identifier of the to register side effect.
   * @param callback - Callback function to be called on each State value change.
   * @param config - Configuration object
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

  /**
   * Removes a side effect callback with the specified key/name identifier from the State.
   *
   * [Learn more..](https://agile-ts.org/docs/core/state/methods/#removesideeffect)
   *
   * @internal
   * @param key - Key/Name identifier of the side effect callback to be removed.
   */
  public removeSideEffect(key: string): this {
    delete this.sideEffects[key];
    return this;
  }

  /**
   * Returns a boolean indicating whether a side effect callback with the specified `key`
   * exists in the State or not.
   *
   * [Learn more..](https://agile-ts.org/docs/core/state/methods/#hassideeffect)
   *
   * @internal
   * @param key - Key/Name identifier of the side effect callback to be checked for existence.
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

  /**
   * Returns the public value of the State.
   *
   * @internal
   */
  public getPublicValue(): ValueType {
    // If State value is used internally
    // and output represents the public State value (for instance in Group)
    if (this['output'] !== undefined) return this['output'];

    return this._value;
  }

  /**
   * Returns the persistable value of the State.
   *
   * @internal
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
  /**
   * Key/Name identifier of the State.
   * @default undefined
   */
  key?: StateKey;
  /**
   * Observers that depend on the State.
   * @default undefined
   */
  dependents?: Array<Observer>;
  /**
   * Whether the State should be a placeholder
   * and therefore should only exist in the background.
   * @default false
   */
  isPlaceholder?: boolean;
}

export interface PatchConfigInterface
  extends StateIngestConfigInterface,
    PatchOptionConfigInterface {}

export interface PatchOptionConfigInterface {
  /**
   * Whether to add new properties to the object during the merge.
   * @default true
   */
  addNewProperties?: boolean;
}

export interface StatePersistentConfigInterface {
  /**
   * Whether the Persistent should automatically load
   * the persisted value into the State after its instantiation.
   * @default true
   */
  loadValue?: boolean;
  /**
   * Key/Name identifier of Storages
   * in which the State value should be or is persisted.
   * @default [AgileTs default Storage key]
   */
  storageKeys?: StorageKey[];
  /**
   * Default Storage key of the specified Storage keys.
   * The State value is loaded from the default Storage
   * and is only loaded from the remaining Storages (storageKeys)
   * if the loading of the default Storage failed.
   * @default first index of the specified Storage keys or the AgileTs default Storage key
   */
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

export interface SideEffectInterface<Instance extends State<any>> {
  /**
   * Callback function to be called on every State value change
   * @return () => {}
   */
  callback: SideEffectFunctionType<Instance>;
  /**
   * Weight of the side effect.
   * Determines the order of execution of the registered side effects.
   * The higher the weight, the earlier it is executed.
   */
  weight: number;
}

export interface AddSideEffectConfigInterface {
  /**
   * Weight of the side effect.
   * Determines the order of execution of the registered side effects.
   * The higher the weight, the earlier it is executed.
   */
  weight?: number;
}
