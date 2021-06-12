import {
  CreatePersistentConfigInterface,
  defineConfig,
  Persistent,
  PersistentKey,
  State,
} from '../internal';

export class StatePersistent<ValueType = any> extends Persistent {
  static storeValueSideEffectKey = 'rebuildStateStorageValue';
  public state: () => State;

  /**
   * Internal Class for managing the permanent persistence of a State.
   *
   * @internal
   * @param state - State to be persisted.
   * @param config - Configuration object
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

    // Load/Store persisted value/s for the first time
    if (this.ready && config.instantiate) this.initialLoading();
  }

  /**
   * Loads the persisted value into the State
   * or persists the State value in the corresponding Storage.
   * This behaviour depends on whether the State has been persisted before.
   *
   * @internal
   */
  public async initialLoading() {
    super.initialLoading().then(() => {
      this.state().isPersisted = true;
    });
  }

  /**
   * Loads the State from the corresponding Storage
   * and sets up side effects that dynamically update
   * the Storage value when the State changes.
   *
   * @internal
   * @param storageItemKey - Storage key of the persisted State Instance.
   * | default = Persistent.key |
   * @return Whether the loading was successful.
   */
  public async loadPersistedValue(
    storageItemKey?: PersistentKey
  ): Promise<boolean> {
    if (!this.ready) return false;
    const _storageItemKey = storageItemKey ?? this._key;

    // Load value from default Storage
    const loadedValue = await this.agileInstance().storages.get<ValueType>(
      _storageItemKey,
      this.config.defaultStorageKey as any
    );
    if (loadedValue == null) return false;

    // Assign loaded value to the State
    this.state().set(loadedValue, {
      storage: false,
      overwrite: true,
    });

    // Setup Side Effects to keep the Storage value in sync
    // with the State value
    this.setupSideEffects(_storageItemKey);

    return true;
  }

  /**
   * Persists the State in the corresponding Storage
   * and sets up side effects that dynamically update
   * the Storage value when the State changes.
   *
   * @internal
   * @param storageItemKey - Storage key of the persisted State Instance.
   * | default = Persistent.key |
   * @return Whether the persisting and the setting up of the side effects was successful.
   */
  public async persistValue(storageItemKey?: PersistentKey): Promise<boolean> {
    if (!this.ready) return false;
    const _storageItemKey = storageItemKey ?? this._key;

    // Setup Side Effects to keep the Storage value in sync
    // with the State value
    this.setupSideEffects(_storageItemKey);

    // Initial rebuild Storage for persisting State value in the corresponding Storage
    this.rebuildStorageSideEffect(this.state(), _storageItemKey);

    this.isPersisted = true;
    return true;
  }

  /**
   * Sets up side effects to keep the Storage value in sync
   * with the State value.
   *
   * @internal
   * @param storageItemKey - Storage key of the persisted State Instance.
   * | default = Persistent.key |
   */
  public setupSideEffects(storageItemKey?: PersistentKey) {
    const _storageItemKey = storageItemKey ?? this._key;

    // Add side effect to the State
    // that updates the Storage value based on the current State value
    this.state().addSideEffect(
      StatePersistent.storeValueSideEffectKey,
      (instance, config) => {
        this.rebuildStorageSideEffect(this.state(), _storageItemKey, config);
      },
      { weight: 0 }
    );
  }

  /**
   * Removes the State from the corresponding Storage.
   * -> State is no longer persisted
   *
   * @internal
   * @param storageItemKey - Storage key of the persisted State Instance.
   * | default = Persistent.key |
   * @return Whether the removal of the persisted value was successful.
   */
  public async removePersistedValue(
    storageItemKey?: PersistentKey
  ): Promise<boolean> {
    if (!this.ready) return false;
    const _storageItemKey = storageItemKey || this._key;
    this.state().removeSideEffect(StatePersistent.storeValueSideEffectKey);
    this.agileInstance().storages.remove(_storageItemKey, this.storageKeys);
    this.isPersisted = false;
    return true;
  }

  /**
   * Formats specified key so that it can be used as a valid Storage key and returns it.
   * If no formatable key (undefined/null) was provided,
   * an attempt is made to use the State identifier key.
   *
   * @internal
   * @param key - Key to be formatted.
   */
  public formatKey(
    key: PersistentKey | undefined | null
  ): PersistentKey | undefined {
    const state = this.state();
    if (!key && state._key) return state._key;
    if (!key) return;
    if (!state._key) state._key = key;
    return key;
  }

  /**
   * Rebuilds Storage value based on the current State value
   *
   * @internal
   * @param state - State whose value to be in sync with the Storage value.
   * @param storageItemKey - Storage key of the persisted State.
   * | default = Persistent.key |
   * @param config - Configuration object
   */
  public rebuildStorageSideEffect(
    state: State<ValueType>,
    storageItemKey: PersistentKey,
    config: { [key: string]: any } = {}
  ) {
    if (config['storage'] == null || config.storage) {
      this.agileInstance().storages.set(
        storageItemKey,
        this.state().getPersistableValue(),
        this.storageKeys
      );
    }
  }
}
