import {
  defineConfig,
  Persistent,
  PersistentKey,
  State,
  StorageKey,
} from "../internal";

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
    super(state.agileInstance());
    config = defineConfig(config, {
      instantiate: true,
    });
    this.state = () => state;

    this.instantiatePersistent({
      key: key,
      storageKeys: config.storageKeys,
    });

    // Load/Store persisted Value/s for the first Time
    if (this.ready && config.instantiate)
      this.initialLoading().then(() => {
        this.state().isPersisted = true;
      });
  }

  //=========================================================================================================
  // Set Key
  //=========================================================================================================
  /**
   * @internal
   * Sets Key/Name of Persistent
   * @param value - New Key/Name of Persistent
   */
  public async setKey(value?: StorageKey): Promise<void> {
    const oldKey = this._key;
    const wasReady = this.ready;

    // Assign Key
    if (value === this._key) return;
    this._key = value || Persistent.placeHolderKey;

    const isValid = this.validatePersistent();

    // Try to Initial Load Value if persistent wasn't ready
    if (!wasReady && isValid) {
      this.initialLoading().then(() => {
        this.state().isPersisted = true;
      });
      return;
    }

    // Remove value at old Key
    await this.removeValue(oldKey);

    // Assign Value to new Key
    if (isValid) await this.updateValue(value);
  }

  //=========================================================================================================
  // Load Value
  //=========================================================================================================
  /**
   * @internal
   * Loads Value from Storage
   * @return Value got loaded
   */
  public async loadValue(key?: PersistentKey): Promise<boolean> {
    if (!this.ready) return false;
    const _key = key || this.key;

    // Load Value from default Storage
    const loadedValue = await this.agileInstance().storages.get<ValueType>(
      _key,
      this.defaultStorageKey
    );

    // If Storage Value found assign it to the State
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
  public async updateValue(key?: PersistentKey): Promise<boolean> {
    if (!this.ready) return false;
    const _key = key || this.key;

    // Update/Create Value in Storage
    this.agileInstance().storages.set(
      _key,
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
  public async removeValue(key?: PersistentKey): Promise<boolean> {
    if (!this.ready) return false;
    const _key = key || this.key;

    // Remove Value from Storage
    this.agileInstance().storages.remove(_key, this.storageKeys);

    this.isPersisted = false;
    return true;
  }

  //=========================================================================================================
  // Format Key
  //=========================================================================================================
  /**
   * @internal
   * Formats Storage Key
   * @param key - Key that gets formatted
   */
  public formatKey(key?: StorageKey): StorageKey | undefined {
    const state = this.state();

    // Get key from State
    if (!key && state.key) return state.key;

    if (!key) return;

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
