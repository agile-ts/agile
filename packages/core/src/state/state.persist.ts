import { Agile, State, StorageKey } from "../internal";

export class StatePersistManager<ValueType = any> {
  public agileInstance: () => Agile;

  public state: () => State;
  public _key: StorageKey = "unknown";
  public ready: boolean = false;

  /**
   * State Persist Manager - Handles the permanent saving of a State
   * @param {Agile} agileInstance - An instance of Agile
   * @param {State} state - State you want to save
   * @param {StorageKey} key - Key of the Storage property
   */
  constructor(agileInstance: Agile, state: State<ValueType>, key?: StorageKey) {
    this.agileInstance = () => agileInstance;
    this.state = () => state;

    // Validate Key
    const finalKey = this.validateKey(key);
    if (!finalKey) {
      console.error(
        "Agile: If your State has no key provided before using persist.. you have to provide a key here!"
      );
      return;
    }
    this._key = finalKey;
    this.ready = true;

    // Load or Save the State Value for the first Time
    this.initialLoading(finalKey);

    agileInstance.storage.persistedStates.add(state);
    state.isPersisted = true;
  }

  public set key(value: StorageKey) {
    if (value === this._key) return;

    // Remove value with old Key
    this.removeValue();

    // Update Key
    this._key = value;

    // If not ready before set it to ready
    if (!this.ready) {
      this.agileInstance().storage.persistedStates.add(this.state());
      this.state().isPersisted = true;
      this.ready = true;
    }

    // Set value with new Key
    this.setValue(this.state().value);
  }

  public get key(): StorageKey {
    return this._key;
  }

  //=========================================================================================================
  // Initial Loading
  //=========================================================================================================
  /**
   * @internal
   * Loads or Saves the StorageValue for the first time
   * @param {StorageKey} key -  Key of the Storage property
   */
  private async initialLoading(key: StorageKey) {
    const state = this.state();

    // Get storage Value
    const storageValue = await this.loadValue();

    // If value doesn't exist in the storage.. create it
    if (!storageValue) {
      this.setValue(state.getPersistableValue());
      return;
    }

    // If value exists in storage, load it into the state
    state.set(storageValue);
  }

  //=========================================================================================================
  // Load Value
  //=========================================================================================================
  /**
   * Loads the State Value from the Storage
   */
  public async loadValue(): Promise<ValueType | undefined> {
    if (!this.ready) return;
    return this.agileInstance().storage.get(this._key);
  }

  //=========================================================================================================
  // Set Value
  //=========================================================================================================
  /**
   * Saves/Updates the State Value in the Storage
   * @param {ValueType} value - Value you want to save
   */
  public setValue(value: ValueType): void {
    if (!this.ready) return;
    return this.agileInstance().storage.set(this._key, value);
  }

  //=========================================================================================================
  // Remove Value
  //=========================================================================================================
  /**
   * Removes the State Value from the Storage
   */
  public removeValue(): void {
    if (!this.ready) return;
    return this.agileInstance().storage.remove(this._key);
  }

  //=========================================================================================================
  // Validate Key
  //=========================================================================================================
  /**
   * @internal
   * Validates the Storage Key
   * @param {StorageKey} key - Key you want to validate
   */
  private validateKey(key?: StorageKey): StorageKey | null {
    const state = this.state();

    // Get key from State key
    if (!key && state.key) return state.key;

    // Return null if no key can be found
    if (!key) return null;

    // Set Storage key as State key if no State key exists
    if (!state.key) state.key = key;

    return key;
  }
}
