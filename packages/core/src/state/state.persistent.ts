import {
  CreatePersistentConfigInterface,
  defineConfig,
  Persistent,
  PersistentKey,
  State,
  StorageKey,
} from '../internal';

export class StatePersistent<ValueType = any> extends Persistent {
  static storeValueSideEffectKey = 'rebuildStateStorageValue';
  public state: () => State;

  /**
   * @internal
   * State Persist Manager - Handles permanent storing of State Value
   * @param state - State that gets stored
   * @param config - Config
   */
  constructor(
    state: State<ValueType>,
    config: CreatePersistentConfigInterface = {}
  ) {
    super(state.agileInstance(), {
      instantiate: false,
    });
    config = defineConfig(config, {
      instantiate: true,
      storageKeys: [],
      defaultStorageKey: null,
    });
    this.state = () => state;
    this.instantiatePersistent({
      key: config.key,
      storageKeys: config.storageKeys,
      defaultStorageKey: config.defaultStorageKey,
    });

    // Load/Store persisted Value for the first Time
    if (this.ready && config.instantiate) this.initialLoading();
  }

  //=========================================================================================================
  // Set Key
  //=========================================================================================================
  /**
   * @internal
   * Updates Key/Name of Persistent
   * @param value - New Key/Name of Persistent
   */
  public async setKey(value?: StorageKey): Promise<void> {
    const oldKey = this._key;
    const wasReady = this.ready;

    // Assign Key
    if (value === this._key) return;
    this._key = value || Persistent.placeHolderKey;

    const isValid = this.validatePersistent();

    // Try to Initial Load Value if persistent wasn't ready and return
    if (!wasReady) {
      if (isValid) await this.initialLoading();
      return;
    }

    // Remove value at old Key
    await this.removePersistedValue(oldKey);

    // Assign Value to new Key
    if (isValid) await this.persistValue(value);
  }

  //=========================================================================================================
  // Initial Loading
  //=========================================================================================================
  /**
   * @internal
   * Loads/Saves Storage Value for the first Time
   */
  public async initialLoading() {
    super.initialLoading().then(() => {
      this.state().isPersisted = true;
    });
  }

  //=========================================================================================================
  // Load Persisted Value
  //=========================================================================================================
  /**
   * @internal
   * Loads State Value from the Storage
   * @param storageKey - Prefix Key of Persisted Instances (default PersistentKey)
   * @return Success?
   */
  public async loadPersistedValue(
    storageKey?: PersistentKey
  ): Promise<boolean> {
    if (!this.ready) return false;
    const _storageKey = storageKey || this._key;

    // Load Value from default Storage
    const loadedValue = await this.agileInstance().storages.get<ValueType>(
      _storageKey,
      this.config.defaultStorageKey as any
    );
    if (!loadedValue) return false;

    // Assign loaded Value to State
    this.state().set(loadedValue, { storage: false });

    // Persist State, so that the Storage Value updates dynamically if the State updates
    await this.persistValue(_storageKey);

    return true;
  }

  //=========================================================================================================
  // Persist Value
  //=========================================================================================================
  /**
   * @internal
   * Sets everything up so that the State gets saved in the Storage on every Value change
   * @param storageKey - Prefix Key of Persisted Instances (default PersistentKey)
   * @return Success?
   */
  public async persistValue(storageKey?: PersistentKey): Promise<boolean> {
    if (!this.ready) return false;
    const _storageKey = storageKey || this._key;

    // Add SideEffect to State, that updates the saved State Value depending on the current State Value
    this.state().addSideEffect(
      StatePersistent.storeValueSideEffectKey,
      (instance, config) => {
        this.rebuildStorageSideEffect(this.state(), _storageKey, config);
      },
      { weight: 0 }
    );

    // Initial rebuild Storage for saving State Value in the Storage
    this.rebuildStorageSideEffect(this.state(), _storageKey);

    this.isPersisted = true;
    return true;
  }

  //=========================================================================================================
  // Remove Persisted Value
  //=========================================================================================================
  /**
   * @internal
   * Removes State Value form the Storage
   * @param storageKey - Prefix Key of Persisted Instances (default PersistentKey)
   * @return Success?
   */
  public async removePersistedValue(
    storageKey?: PersistentKey
  ): Promise<boolean> {
    if (!this.ready) return false;
    const _storageKey = storageKey || this._key;

    // Remove SideEffect
    this.state().removeSideEffect(StatePersistent.storeValueSideEffectKey);

    // Remove Value from Storage
    this.agileInstance().storages.remove(_storageKey, this.storageKeys);

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
  public formatKey(key?: PersistentKey): PersistentKey | undefined {
    const state = this.state();

    // Get key from State
    if (!key && state._key) return state._key;

    if (!key) return;

    // Set State Key to Storage Key if State has no key
    if (!state._key) state._key = key;

    return key;
  }

  //=========================================================================================================
  // Rebuild Storage SideEffect
  //=========================================================================================================
  /**
   * @internal
   * Rebuilds Storage depending on the State Value (Saves current State Value into the Storage)
   * @param state - State that holds the new Value
   * @param storageKey - StorageKey where value should be persisted
   * @param config - Config
   */
  public rebuildStorageSideEffect(
    state: State<ValueType>,
    storageKey: PersistentKey,
    config: { [key: string]: any } = {}
  ) {
    if (config.storage !== undefined && !config.storage) return;

    this.agileInstance().storages.set(
      storageKey,
      this.state().getPersistableValue(),
      this.storageKeys
    );
  }
}
