import { defineConfig, Persistent, State, StorageKey } from "../internal";

export class StatePersistent<ValueType = any> extends Persistent {
  public state: () => State;

  /**
   * @internal
   * State Persist Manager - Handles permanent storing of State Value
   * @param state - State that gets stored
   * @param key - Key of Storage property
   * @param config - Config
   */
  constructor(
    state: State<ValueType>,
    key?: StorageKey,
    config: StatePersistentConfigInterface = {}
  ) {
    super(state.agileInstance(), config.storageKeys);
    config = defineConfig(config, {
      instantiate: true,
    });
    this.state = () => state;
    this.storageKeys = config.storageKeys;
    if (config?.instantiate)
      this.instantiatePersistent(key).then((success) => {
        this.state().isPersisted = success;
      });
  }

  //=========================================================================================================
  // Set Key
  //=========================================================================================================
  /**
   * @public
   * Sets Key/Name of Persistent
   * @param value - New Key/Name of Persistent
   */
  public async setKey(value: StorageKey) {
    // If persistent isn't ready try to init it with the new Key
    if (!this.ready) {
      this.instantiatePersistent(value).then((success) => {
        this.state().isPersisted = success;
      });
      return;
    }

    // Check if key has changed
    if (value === this._key) return;

    // Remove value with old Key
    await this.removeValue();

    // Update Key
    this._key = value;

    // Set value with new Key
    await this.updateValue();
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
    const loadedValue = await this.agileInstance().storages.get<ValueType>(
      this._key,
      this.storageKeys && this.storageKeys[0]
    );
    if (loadedValue) {
      this.state().set(loadedValue, { storage: false });
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
    this.agileInstance().storages.set(
      this.key,
      this.state().getPersistableValue(),
      this.storageKeys
    );
    this.isPersisted = true;
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
    this.agileInstance().storages.remove(this.key, this.storageKeys);
    this.isPersisted = false;
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

    // Set State Key to Storage Key if State has no key
    if (!state.key) state.key = key;

    return key;
  }
}

/**
 * @param instantiate - If Persistent gets instantiated
 * @param storageKeys - Key/Name of Storages which gets used to persist the State Value (NOTE: If not passed the default Storage will be used)
 */
export interface StatePersistentConfigInterface {
  instantiate?: boolean;
  storageKeys?: StorageKey[];
}
