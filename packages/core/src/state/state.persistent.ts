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
    this.initPersistent(key).then((success) => {
      state.isPersisted = success;
    });
  }

  public set key(value: StorageKey) {
    // If persistent isn't ready try to init it
    if (!this.ready) {
      this.initPersistent(value).then((success) => {
        this.state().isPersisted = success;
      });
      return;
    }

    // Check if key has changed
    if (value === this._key) return;

    // Updates Key in Storage
    const updateKey = async () => {
      // Remove value with old Key
      await this.removeValue();

      // Update Key
      this._key = value;

      // Set value with new Key
      await this.updateValue();
    };

    updateKey();
  }

  public get key(): StorageKey {
    return this._key;
  }

  //=========================================================================================================
  // Load Value
  //=========================================================================================================
  /**
   * @internal
   * Loads Value from Storage
   * @return Success?
   */
  public async loadValue(): Promise<boolean> {
    if (!this.ready) return false;
    const loadedValue = await this.agileInstance().storage.get(this._key);
    if (loadedValue) {
      this.state().set(loadedValue);
      return true;
    }
    return false;
  }

  //=========================================================================================================
  // Set Value
  //=========================================================================================================
  /**
   * @internal
   * Saves/Updates Value in Storage
   * @return Success?
   */
  public async updateValue(): Promise<boolean> {
    if (!this.ready) return false;
    this.agileInstance().storage.set(
      this.key,
      this.state().getPersistableValue()
    );
    this.state().isPersisted = true;
    return true;
  }

  //=========================================================================================================
  // Remove Value
  //=========================================================================================================
  /**
   * @internal
   * Removes Value form Storage
   * @return Success?
   */
  public async removeValue(): Promise<boolean> {
    if (!this.ready) return false;
    this.agileInstance().storage.remove(this.key);
    this.state().isPersisted = false;
    return true;
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

    // Get key from State
    if (!key && state.key) return state.key;

    // Return null if no key found
    if (!key) return null;

    // Set State Key to Storage Key if State key isn't set
    if (!state.key) state.key = key;

    return key;
  }
}
