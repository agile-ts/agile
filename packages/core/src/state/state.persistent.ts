import { Agile, Persistent, State, StorageKey } from "../internal";

export class StatePersistent<ValueType = any> extends Persistent {
  public state: () => State;

  /**
   * @internal
   * State Persist Manager - Handles the permanent saving of a State
   * @param {Agile} agileInstance - An instance of Agile
   * @param {State} state - State you want to save
   * @param {StorageKey} key - Key of the Storage property
   */
  constructor(agileInstance: Agile, state: State<ValueType>, key?: StorageKey) {
    super(agileInstance);
    this.state = () => state;
    if (this.initPersistent(key)) state.isPersisted = true;
  }

  public set key(value: StorageKey) {
    // If persistent isn't ready try to init it again
    if (!this.ready) {
      this.initPersistent(value);
      return;
    }

    if (value === this._key) return;

    // Remove value with old Key
    this.removeValue();

    // Update Key
    this._key = value;

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
  public async initialLoading(key: StorageKey) {
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
  // Validate Key
  //=========================================================================================================
  /**
   * @internal
   * Validates the Storage Key
   * @param {StorageKey} key - Key you want to validate
   */
  public validateKey(key?: StorageKey): StorageKey | null {
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
