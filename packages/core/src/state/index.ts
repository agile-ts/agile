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
  isFunction,
  notEqual,
} from "../internal";

export class State<ValueType = any> {
  public agileInstance: () => Agile;

  public _key?: StateKey;
  public valueType?: string; // primitive types for js users
  public isSet: boolean = false; // If value has is not the same as initialValue
  public isPlaceholder: boolean = false; // If placeholder its just a placeholder of a state, because the state isn't defined yet
  public initialStateValue: ValueType;
  public _value: ValueType; // Current Value of the State
  public previousStateValue: ValueType;
  public nextStateValue: ValueType; // The nextStateValue is used internal and represents the next State Value which can be edited as wished

  public observer: StateObserver; // Handles deps and subs of the State (rerender stuff)
  public sideEffects: { [key: string]: () => void } = {}; // SideEffects during the Runtime process

  public isPersisted: boolean = false; // If the State got saved in Storage
  public persistent: StatePersistent | undefined; // Manages saving the State into Storage

  public watchers: { [key: string]: (value: any) => void } = {};

  /**
   * @public
   * State - Handles value and causes rerender on subscribed Components
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
    this.initialStateValue = initialValue;
    this._key = key;
    this._value = initialValue;
    this.previousStateValue = initialValue;
    this.nextStateValue = initialValue;
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
    if (this.agileInstance().runtime.trackObservers)
      this.agileInstance().runtime.foundObservers.add(this.observer);

    return this._value;
  }

  public set key(value: StateKey | undefined) {
    const oldKey = this._key;

    // Change State Key
    this._key = value;

    // Change Key in Observer
    this.observer.key = value;

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

    // Ingest updated value into runtime
    this.observer.ingest(value, config);

    return this;
  }

  //=========================================================================================================
  // Ingest
  //=========================================================================================================
  /**
   * @internal
   * Ingests nextState, computedValue into Runtime
   * -> updates State and causes rerender if necessary
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
   * @public
   * Assign a initial default type to a State
   * Note this is mainly thought for JS users
   * @param type - wished Type ('String', 'Boolean', 'Array', 'Object', 'Number')
   */
  public type(type: any): this {
    const supportedTypes = ["String", "Boolean", "Array", "Object", "Number"];

    // Check if type is a supported Type
    if (!supportedTypes.includes(type.name)) {
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
   * @public
   * Undoes the last State change
   */
  public undo() {
    this.set(this.previousStateValue);
  }

  //=========================================================================================================
  // Reset
  //=========================================================================================================
  /**
   * @public
   * Resets the State to its initial value
   */
  public reset(): this {
    this.set(this.initialStateValue);

    // Remove State from Storage (since its the initial State)
    if (this.isPersisted && this.persistent) this.persistent.removeValue();

    return this;
  }

  //=========================================================================================================
  // Patch
  //=========================================================================================================
  /**
   * @public
   * Patches changes into object
   * Note: Only useful if State is object
   * @param {object} targetWithChanges - The Object which includes the changes which than will be patched into the State
   * @param {PatchConfigInterface} config - Config
   */
  public patch(
    targetWithChanges: object,
    config: PatchConfigInterface = {}
  ): this {
    config = defineConfig(config, {
      addNewProperties: true,
      background: false,
    });

    if (!isValidObject(this.nextStateValue)) {
      console.warn(
        "Agile: You can't use the patch method on a non object States!"
      );
      return this;
    }

    if (!isValidObject(targetWithChanges)) {
      console.warn("Agile: TargetWithChanges has to be an object!");
      return this;
    }

    // Merge targetWithChanges into nextStateValue
    this.nextStateValue = flatMerge<ValueType>(
      this.nextStateValue,
      targetWithChanges,
      { addNewProperties: config.addNewProperties }
    );

    // Check if value has changed
    if (equal(this.value, this.nextStateValue)) return this;

    // Ingest updated nextStateValue
    this.ingest({ background: config.background });

    return this;
  }

  //=========================================================================================================
  // Watch
  //=========================================================================================================
  /**
   * @public
   * Watches State and detect State changes
   * @param {string} key - Key of the Watcher
   * @param {(value: ValueType) => void} callback - Callback Function which should be called if State changes
   */
  public watch(key: string, callback: (value: ValueType) => void): this {
    if (!isFunction(callback)) {
      console.error(
        "Agile: A watcher callback function has to be an function!"
      );
      return this;
    }

    this.watchers[key] = callback;
    return this;
  }

  //=========================================================================================================
  // Remove Watcher
  //=========================================================================================================
  /**
   * @public
   * Removes Watcher at given Key
   * @param {string} key - Key of the Watcher you want to remove
   */
  public removeWatcher(key: string): this {
    delete this.watchers[key];
    return this;
  }

  //=========================================================================================================
  // Persist
  //=========================================================================================================
  /**
   * @public
   * Saves State in custom or local Storage
   * @param {string} key - Storage Key (Note: not needed if State has already a key/name)
   */
  public persist(key?: StorageKey): this {
    if (this.isPersisted && this.persistent) {
      console.warn(`Agile: The State '${this.key}' is already persisted!`);

      // Update Key in Persistent
      if (key) this.persistent.key = key;
      return this;
    }

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
   * @public
   * Creates a fresh copy of the State Value (-> No reference to State value)
   */
  public copy(): ValueType {
    return copy(this.value);
  }

  //=========================================================================================================
  // Exists
  //=========================================================================================================
  /**
   * @public
   * Checks if the State exists
   */
  public get exists(): boolean {
    return this.getPublicValue() !== undefined && !this.isPlaceholder;
  }

  //=========================================================================================================
  // Is
  //=========================================================================================================
  /**
   * @public
   * Equivalent to ===
   * @param {ValueType} value - value which you want to check if its equals to the State value
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
   * @param {ValueType} value - value which you want to check if its not equals to the State value
   */
  public isNot(value: ValueType): boolean {
    return notEqual(value, this.value);
  }

  //=========================================================================================================
  // Toggle
  //=========================================================================================================
  /**
   * @public
   * Inverts the State
   * Note: Only useful by boolean based States
   */
  public invert(): this {
    if (typeof this._value !== "boolean") {
      console.warn("Agile: You can only invert boolean based States!");
      return this;
    }
    this.set(this._value);

    return this;
  }

  //=========================================================================================================
  // Add SideEffect
  //=========================================================================================================
  /**
   * @internal
   * Add a SideEffect to State (Will be called on every State change)
   * @param {string} key - Key of the Watcher
   * @param {() => void)} sideEffect - Callback Function which should be called if State changes
   */
  public addSideEffect(key: string, sideEffect: () => void): this {
    if (!isFunction(sideEffect)) {
      console.error(
        "Agile: A watcher sideEffect function has to be an function!"
      );
      return this;
    }

    this.sideEffects[key] = sideEffect;
    return this;
  }

  //=========================================================================================================
  // Remove SideEffect
  //=========================================================================================================
  /**
   * @internal
   * Remove SideEffect at given Key
   * @param {string} key - Key of the SideEffect you want to remove
   */
  public removeSideEffect(key: string): this {
    delete this.sideEffects[key];
    return this;
  }

  //=========================================================================================================
  // Private Write
  //=========================================================================================================
  /**
   * @internal
   *  Writes value into State
   *  Note: doesn't cause rerender and so.. for that use the Set Function
   *  @param {any} value - Value you want to write into the State
   */
  public privateWrite(value: any) {
    this._value = copy(value);
    this.nextStateValue = copy(value);

    // Save changes in Storage
    if (this.isPersisted && this.persistent) this.persistent.setValue(value);
  }

  //=========================================================================================================
  // Is Correct Type
  //=========================================================================================================
  /**
   * @internal
   * Checks if Value has correct valueType
   *  @param {any} value - Value you want to check if it has correct valueType
   */
  private isCorrectType(value: any): boolean {
    let type: string = typeof value;
    return type === this.valueType;
  }

  //=========================================================================================================
  // Get Public Value
  //=========================================================================================================
  /**
   * @internal
   *  Returns public value of this State
   */
  public getPublicValue(): ValueType {
    // If the State value for the wide world isn't the value its the output (see Group)
    if (this["output"] !== undefined) return this["output"];

    return this._value;
  }

  //=========================================================================================================
  // Get Persistable Value
  //=========================================================================================================
  /**
   * @internal
   *  Returns persistableValue Value of this State
   */
  public getPersistableValue(): any {
    return this.value;
  }
}

export type StateKey = string | number;
/**
 * @param {boolean} background - If assigning a new value should happen in the background -> not causing a rerender
 * @param {boolean} sideEffects - If Side Effects of the State should get executed (sideEffects)
 */
export interface SetConfigInterface {
  background?: boolean;
  sideEffects?: boolean;
}
/**
 * @param {boolean} background - If assigning a new value should happen in the background -> not causing a rerender
 * @param {boolean} addNewProperties - If it should add new properties to the State object
 */
export interface PatchConfigInterface {
  addNewProperties?: boolean;
  background?: boolean;
}
