import {
  Agile,
  StorageKey,
  copy,
  defineConfig,
  flatMerge,
  isValidObject,
  StateObserver,
  internalIngestKey,
  StatePersistent,
  Observer,
  equal,
  StateJobConfigInterface,
} from "../internal";

export type StateKey = string | number;

/**
 * @param {boolean} background - If assigning a the new value should happen in the background -> not causing a rerender
 * @param {boolean} sideEffects - If Side Effects of the State should get executed (sideEffects)
 */
export interface SetConfigInterface {
  background?: boolean;
  sideEffects?: boolean;
}

export class State<ValueType = any> {
  public agileInstance: () => Agile;

  public _key?: StateKey;
  public valueType?: string; // primitive types for js users
  public isSet: boolean = false; // If value has is not the same as initialValue
  public isPlaceholder: boolean = false; // If placeholder its just a placeholder of a state, because the state isn't defined yet
  public initialState: ValueType;
  public _value: ValueType; // Current Value of the State
  public previousState: ValueType;
  public nextState: ValueType; // The next state is used internal and represents the nextState which can be edited as wished

  public observer: StateObserver; // Handles deps and subs of the State (rerender stuff)
  public sideEffects: { [key: string]: () => void } = {}; // SideEffects during the Runtime process

  public isPersisted: boolean = false; // If the State got saved in Storage
  public persistent: StatePersistent | undefined; // Manages saving the State into Storage

  public watchers: { [key: string]: (value: any) => void } = {};

  /**
   * State
   * @param {Agile} agileInstance - An instance of Agile
   * @param {ValueType} initialValue - Initial Value of the State
   * @param {StateKey} key - Key/Name of the State
   * @param {Array<Observer>} deps - Initial deps of the State
   */
  constructor(
    agileInstance: Agile,
    initialValue: ValueType,
    key?: StateKey,
    deps: Array<Observer> = []
  ) {
    this.agileInstance = () => agileInstance;
    this.initialState = initialValue;
    this._key = key;
    this._value = initialValue;
    this.previousState = initialValue;
    this.nextState = initialValue;
    this.observer = new StateObserver<ValueType>(
      agileInstance,
      this,
      deps,
      key
    );
  }

  public set value(value: ValueType) {
    this.set(value);
  }

  public get value(): ValueType {
    // Add state to Observers (for auto tracking used observers in computed function)
    if (this.agileInstance().runtime.trackObserver)
      this.agileInstance().runtime.foundObservers.add(this.observer);

    return this._value;
  }

  public set key(value: StateKey | undefined) {
    const oldKey = this._key;

    // Change State Key
    this._key = value;

    // Change Key in Observer
    this.observer.key = `o_${value}`;

    // Change Key in PersistManager
    if (this.isPersisted && this.persistent) {
      if (value && this.persistent.key === oldKey) this.persistent.key = value;
    }
  }

  public get key(): StateKey | undefined {
    return this._key;
  }

  //=========================================================================================================
  // Set
  //=========================================================================================================
  /**
   * @public
   * Update the Value of the State
   * @param {ValueType} value - The new Value which you want to assign to the State
   * @param {SetConfigInterface} config - Config
   */
  public set(value: ValueType, config: SetConfigInterface = {}): this {
    config = defineConfig(config, {
      sideEffects: true,
      background: false,
    });

    // Check if Type is Correct (js)
    if (this.valueType && !this.isCorrectType(value)) {
      console.warn(`Agile: Incorrect type (${typeof value}) was provided.`);
      return this;
    }

    // Check if value has changed
    if (equal(this.value, value)) return this;

    // Ingest updated value
    this.observer.ingest(value, config);

    return this;
  }

  //=========================================================================================================
  // Ingest
  //=========================================================================================================
  /**
   * @internal
   * Ingests the nextState, computedValue into the runtime
   * @param {StateJobConfigInterface} config - Config
   */
  public ingest(config: StateJobConfigInterface = {}): this {
    config = defineConfig(config, {
      sideEffects: true,
      background: false,
      forceRerender: false,
    });
    this.observer.ingest(internalIngestKey, config);
    return this;
  }

  //=========================================================================================================
  // Type
  //=========================================================================================================
  /**
   * This is thought for js users.. because ts users can set the type in <>
   * @param type - wished type of the state
   */
  public type(type: any): this {
    const supportedTypes = ["String", "Boolean", "Array", "Object", "Number"];

    // Check if type is a supported Type
    if (
      supportedTypes.findIndex(
        (supportedType) => supportedType === type.name
      ) === -1
    ) {
      console.warn(
        `Agile: '${type}' is not supported! Supported types: String, Boolean, Array, Object, Number`
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
   * Will set the state to the previous State
   */
  public undo() {
    this.set(this.previousState);
  }

  //=========================================================================================================
  // Reset
  //=========================================================================================================
  /**
   * Will reset the state to the initial value
   */
  public reset(): this {
    // Remove State from Storage (because it is than the initial State again and there is no need to save it anymore)
    if (this.isPersisted && this.persistent) this.persistent.removeValue();

    // Set State to initial State
    this.set(this.initialState);
    return this;
  }

  //=========================================================================================================
  // Patch
  //=========================================================================================================
  /**
   * Will merge the changes into the state
   */
  public patch(
    targetWithChanges: object,
    options: { addNewProperties?: boolean; background?: boolean } = {}
  ): this {
    // Check if state is object.. because only objects can use the patch method
    if (!isValidObject(this.nextState)) {
      console.warn(
        "Agile: You can't use the patch method on a non object state!"
      );
      return this;
    }

    // Check if targetWithChanges is an Object.. because you can only patch objects into the State Object
    if (!isValidObject(targetWithChanges)) {
      console.warn("Agile: TargetWithChanges has to be an object!");
      return this;
    }

    // Assign defaults to options
    options = defineConfig(options, {
      addNewProperties: true,
      background: false,
    });

    // Merge targetWithChanges into next State
    this.nextState = flatMerge<ValueType>(
      this.nextState,
      targetWithChanges,
      options
    );

    // Check if something has changed (stringifying because of possible object or array)
    if (JSON.stringify(this.value) === JSON.stringify(this.nextState))
      return this;

    // Set State to nextState
    this.ingest({ background: options.background });

    this.isSet = this.nextState !== this.initialState;
    return this;
  }

  //=========================================================================================================
  // Watch
  //=========================================================================================================
  /**
   * Will always be called if the state changes
   * @param key - The key of the watch method
   * @param callback - The callback function
   */
  public watch(key: string, callback: (value: ValueType) => void): this {
    // Check if callback is a function  (js)
    if (typeof callback !== "function") {
      console.error(
        "Agile: A watcher callback function has to be an function!"
      );
      return this;
    }

    // Add callback with key to watchers
    this.watchers[key] = callback;

    return this;
  }

  //=========================================================================================================
  // Remove Watcher
  //=========================================================================================================
  /**
   * Removes a watcher called after the key
   * @param key - the key of the watcher function
   */
  public removeWatcher(key: string): this {
    delete this.watchers[key];
    return this;
  }

  //=========================================================================================================
  // Persist
  //=========================================================================================================
  /**
   * Saves the state in the local storage or in a own configured storage
   * @param key - the storage key (if no key passed it will take the state key)
   */
  public persist(key?: StorageKey): this {
    if (this.isPersisted && this.persistent) {
      console.warn(`Agile: The State '${this.key}' is already persisted!`);

      // Update Key in Persistent
      if (key) this.persistent.key = key;
      return this;
    }

    // Create new Persistent instance
    this.persistent = new StatePersistent<ValueType>(
      this.agileInstance(),
      this,
      key
    );
    return this;
  }

  //=========================================================================================================
  // Copy
  //=========================================================================================================
  /**
   * Returns a fresh copy of the current value
   */
  public copy(): ValueType {
    return copy(this.value);
  }

  //=========================================================================================================
  // Exists
  //=========================================================================================================
  /**
   * Checks if the State exists
   */
  public get exists(): boolean {
    // Check if the value is not undefined and that the state is no placeholder
    return this.getPublicValue() !== undefined && !this.isPlaceholder;
  }

  //=========================================================================================================
  // Add SideEffect
  //=========================================================================================================
  /**
   * Add a SideEffect to the State
   */
  public addSideEffect(key: string, sideEffect: () => void): this {
    this.sideEffects[key] = sideEffect;
    return this;
  }

  //=========================================================================================================
  // Remove SideEffect
  //=========================================================================================================
  /**
   * Removes a Side affect from the State
   */
  public removeSideEffect(key: string): this {
    delete this.sideEffects[key];
    return this;
  }

  //=========================================================================================================
  // Get Public Value
  //=========================================================================================================
  /**
   * @internal
   *  Returns the public value (will be overwritten for instance in group)
   */
  public getPublicValue(): ValueType {
    return this._value;
  }

  //=========================================================================================================
  // Private Write
  //=========================================================================================================
  /**
   * @internal
   *  Will set a new _value and handles the stuff around like storage, ..
   */
  public privateWrite(value: any) {
    this._value = copy(value);
    this.nextState = copy(value);

    // Save changes in Storage
    if (this.isPersisted && this.persistent) this.persistent.setValue(value);
  }

  //=========================================================================================================
  // Get Persistable Value
  //=========================================================================================================
  /**
   * @internal
   *  Will return the perstiable Value of this state..
   *  some classes which extends state might have another peristiableValue than this.value (like the selector)
   */
  public getPersistableValue(): any {
    return this.value;
  }

  //=========================================================================================================
  // Is Correct Type
  //=========================================================================================================
  /**
   * @internal
   * Checks if the 'value' has the same type as state.value
   */
  private isCorrectType(value: any): boolean {
    let type: string = typeof value;
    return type === this.valueType;
  }
}
