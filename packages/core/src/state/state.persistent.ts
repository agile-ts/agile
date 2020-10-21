import { Agile, Persistent, State, StorageKey } from "../internal";

export class StatePersistent<ValueType = any> extends Persistent {
  public state: () => State;

  /**
   * @internal
   * State Persist Manager - Handles permanent saving of State Value
   * @param agileInstance - An instance of Agile
   * @param state - State
   * @param key - Key of Storage property
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

    // Check if key has changed
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
   * Loads/Saves State Value for the first Time
   * @param key -  Key of Storage property
   */
  public async initialLoading(key: StorageKey) {
    const state = this.state();

    // Get storage Value
    const storageValue = await this.loadValue();

    // If value doesn't exist in the storage, add it
    if (!storageValue) {
      this.setValue(state.getPersistableValue());
      return;
    }

    // If value exists in storage, load it into State
    state.set(storageValue);
  }

  //=========================================================================================================
  // Validate Key
  //=========================================================================================================
  /**
   * @internal
   * Validates Storage Key
   * @param key - Key that gets validated
   */
  public validateKey(key?: StorageKey): StorageKey | null {
    const state = this.state();

    // Get key from State key
    if (!key && state.key) return state.key;

    // Return null if no key found
    if (!key) return null;

    // Set State Key to Storage Key if State key isn't set
    if (!state.key) state.key = key;

    return key;
  }
}
