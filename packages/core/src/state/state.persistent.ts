import { defineConfig } from '@agile-ts/utils';
import {
  CreatePersistentConfigInterface,
  getSharedStorageManager,
  Persistent,
  PersistentKey,
} from '../storages';
import { EnhancedState } from './state.enhanced';

export class StatePersistent<ValueType = any> extends Persistent {
  // State the Persistent belongs to
  public state: () => EnhancedState;

  static storeValueSideEffectKey = 'rebuildStateStorageValue';

  /**
   * Internal Class for managing the permanent persistence of a State.
   *
   * @internal
   * @param state - State to be persisted.
   * @param config - Configuration object
   */
  constructor(
    state: EnhancedState<ValueType>,
    config: CreatePersistentConfigInterface = {}
  ) {
    super(state.agileInstance(), {
      loadValue: false,
    });
    config = defineConfig(config, {
      loadValue: true,
      storageKeys: [],
      defaultStorageKey: null as any,
    });
    this.state = () => state;
    this.instantiatePersistent({
      key: config.key,
      storageKeys: config.storageKeys,
      defaultStorageKey: config.defaultStorageKey,
    });

    // Load/Store persisted value/s for the first time
    if (this.ready && config.loadValue) this.initialLoading();
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
   * @param storageItemKey - Storage key of the to load State Instance.
   * | default = Persistent.key |
   * @return Whether the loading of the persisted State Instance and the setting up of the corresponding side effects was successful.
   */
  public async loadPersistedValue(
    storageItemKey?: PersistentKey
  ): Promise<boolean> {
    if (!this.ready) return false;
    const _storageItemKey = storageItemKey ?? this._key;

    // Load State value from the default Storage
    const loadedValue = await getSharedStorageManager()?.get<ValueType>(
      _storageItemKey,
      this.config.defaultStorageKey as any
    );
    if (loadedValue == null) return false;

    // Assign loaded value to the State
    this.state().set(loadedValue, {
      storage: false,
      overwrite: true,
    });

    // Setup side effects to keep the Storage value in sync
    // with the current State value
    this.setupSideEffects(_storageItemKey);

    return true;
  }

  /**
   * Persists the State in the corresponding Storage
   * and sets up side effects that dynamically update
   * the Storage value when the State changes.
   *
   * @internal
   * @param storageItemKey - Storage key of the to persist State Instance.
   * | default = Persistent.key |
   * @return Whether the persisting of the State Instance and setting up of the corresponding side effects was successful.
   */
  public async persistValue(storageItemKey?: PersistentKey): Promise<boolean> {
    if (!this.ready) return false;
    const _storageItemKey = storageItemKey ?? this._key;

    // Setup side effects to keep the Storage value in sync
    // with the State value
    this.setupSideEffects(_storageItemKey);

    // Initial rebuild Storage for persisting State value in the corresponding Storage
    this.rebuildStorageSideEffect(this.state(), _storageItemKey);

    this.isPersisted = true;
    return true;
  }

  /**
   * Sets up side effects to keep the Storage value in sync
   * with the current State value.
   *
   * @internal
   * @param storageItemKey - Storage key of the persisted State Instance.
   * | default = Persistent.key |
   */
  public setupSideEffects(storageItemKey?: PersistentKey) {
    const _storageItemKey = storageItemKey ?? this._key;
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
   * @param storageItemKey - Storage key of the to remove State Instance.
   * | default = Persistent.key |
   * @return Whether the removal of the persisted State Instance was successful.
   */
  public async removePersistedValue(
    storageItemKey?: PersistentKey
  ): Promise<boolean> {
    if (!this.ready) return false;
    const _storageItemKey = storageItemKey || this._key;
    this.state().removeSideEffect(StatePersistent.storeValueSideEffectKey);
    getSharedStorageManager()?.remove(_storageItemKey, this.storageKeys);
    this.isPersisted = false;
    return true;
  }

  /**
   * Formats the specified key so that it can be used as a valid Storage key
   * and returns the formatted variant of it.
   *
   * If no formatable key (`undefined`/`null`) was provided,
   * an attempt is made to use the State identifier key as Storage key.
   *
   * @internal
   * @param key - Storage key to be formatted.
   */
  public formatKey(
    key: PersistentKey | undefined | null
  ): PersistentKey | undefined {
    if (key == null && this.state()._key) return this.state()._key;
    if (key == null) return;
    if (this.state()._key == null) this.state()._key = key;
    return key;
  }

  /**
   * Rebuilds Storage value based on the current State value.
   *
   * @internal
   * @param state - State whose current value to be applied to the Storage value.
   * @param storageItemKey - Storage key of the persisted State Instance.
   * | default = Persistent.key |
   * @param config - Configuration object
   */
  public rebuildStorageSideEffect(
    state: EnhancedState<ValueType>,
    storageItemKey: PersistentKey,
    config: { [key: string]: any } = {}
  ) {
    if (config['storage'] == null || config.storage) {
      getSharedStorageManager()?.set(
        storageItemKey,
        this.state().getPersistableValue(),
        this.storageKeys
      );
    }
  }
}
