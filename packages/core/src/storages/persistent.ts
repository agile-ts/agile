import {
  Agile,
  copy,
  defineConfig,
  LogCodeManager,
  StorageKey,
} from '../internal';

export class Persistent {
  public agileInstance: () => Agile;

  public static placeHolderKey = '__THIS_IS_A_PLACEHOLDER__';
  public config: PersistentConfigInterface;

  public _key: PersistentKey;
  public ready = false;
  public isPersisted = false; // If Value is stored in Agile Storage
  public onLoad: ((success: boolean) => void) | undefined; // Gets called if PersistValue got loaded for the first Time

  // Storages in which the Persisted Value is saved
  public storageKeys: StorageKey[] = [];

  /**
   * @internal
   * Persistent - Handles storing of Agile Instances
   * Note: No stand alone class!!
   * @param agileInstance - An instance of Agile
   * @param config - Config
   */
  constructor(
    agileInstance: Agile,
    config: CreatePersistentConfigInterface = {}
  ) {
    this.agileInstance = () => agileInstance;
    this._key = Persistent.placeHolderKey;
    config = defineConfig(config, {
      instantiate: true,
      storageKeys: [],
      defaultStorageKey: null,
    });
    this.agileInstance().storages.persistentInstances.add(this);
    this.config = { defaultStorageKey: config.defaultStorageKey as any };

    // Instantiate Persistent
    if (config.instantiate) {
      this.instantiatePersistent({
        storageKeys: config.storageKeys,
        key: config.key,
        defaultStorageKey: config.defaultStorageKey,
      });
    }
  }

  /**
   * Updates the key/name identifier of the Persistent.
   *
   * @public
   * @param value - New key/name identifier.
   */
  public set key(value: StorageKey) {
    this.setKey(value);
  }

  /**
   * Returns the key/name identifier of the Persistent.
   *
   * @public
   */
  public get key(): StorageKey {
    return this._key;
  }

  /**
   * Updates key/name identifier of Persistent.
   *
   * @public
   * @param value - New key/name identifier.
   */
  public async setKey(value?: StorageKey): Promise<void> {
    const oldKey = this._key;
    const wasReady = this.ready;

    // Assign new key to Persistent
    if (value === this._key) return;
    this._key = value ?? Persistent.placeHolderKey;

    const isValid = this.validatePersistent();

    // Try to initial load value if persistent wasn't ready before
    if (!wasReady) {
      if (isValid) await this.initialLoading();
      return;
    }

    // Remove persisted values with the old key
    await this.removePersistedValue(oldKey);

    // Persist Collection values with the new key
    if (isValid) await this.persistValue(value);
  }

  //=========================================================================================================
  // Instantiate Persistent
  //=========================================================================================================
  /**
   * @internal
   * Instantiates this Class
   * Note: Had to outsource it from the constructor because some extending classes
   * have to define some stuff before being able to instantiate the parent (this)
   * @param config - Config
   */
  public instantiatePersistent(
    config: InstantiatePersistentConfigInterface = {}
  ) {
    this._key = this.formatKey(config.key) ?? Persistent.placeHolderKey;
    this.assignStorageKeys(config.storageKeys, config.defaultStorageKey);
    this.validatePersistent();
  }

  //=========================================================================================================
  // Validate Persistent
  //=========================================================================================================
  /**
   * @internal
   * Validates Persistent and updates its 'ready' property
   */
  public validatePersistent(): boolean {
    let isValid = true;

    // Validate Key
    if (this._key === Persistent.placeHolderKey) {
      LogCodeManager.log('12:03:00');
      isValid = false;
    }

    // Validate StorageKeys
    if (!this.config.defaultStorageKey || this.storageKeys.length <= 0) {
      LogCodeManager.log('12:03:01');
      isValid = false;
    }

    // Check if Storages exist
    this.storageKeys.map((key) => {
      if (!this.agileInstance().storages.storages[key]) {
        LogCodeManager.log('12:03:02', [this._key, key]);
        isValid = false;
      }
    });

    this.ready = isValid;
    return isValid;
  }

  //=========================================================================================================
  // Assign StorageKeys
  //=========================================================================================================
  /**
   * @internal
   * Assign new StorageKeys to Persistent and overwrite the old ones
   * @param storageKeys - New Storage Keys
   * @param defaultStorageKey - Key of default Storage
   */
  public assignStorageKeys(
    storageKeys: StorageKey[] = [],
    defaultStorageKey?: StorageKey
  ): void {
    const storages = this.agileInstance().storages;
    const _storageKeys = copy(storageKeys);

    // Add passed default Storage Key to 'storageKeys'
    if (defaultStorageKey && !_storageKeys.includes(defaultStorageKey))
      _storageKeys.push(defaultStorageKey);

    // Add default Storage of AgileTs to storageKeys and assign it as default Storage Key of Persistent if no storageKeys provided
    if (_storageKeys.length <= 0) {
      this.config.defaultStorageKey = storages.config.defaultStorageKey as any;
      _storageKeys.push(storages.config.defaultStorageKey as any);
    } else {
      this.config.defaultStorageKey = defaultStorageKey || _storageKeys[0];
    }

    this.storageKeys = _storageKeys;
  }

  //=========================================================================================================
  // Initial Loading
  //=========================================================================================================
  /**
   * @internal
   * Loads/Saves Storage Value for the first Time
   */
  public async initialLoading(): Promise<void> {
    const success = await this.loadPersistedValue();
    if (this.onLoad) this.onLoad(success);
    if (!success) await this.persistValue();
  }

  //=========================================================================================================
  // Load Value
  //=========================================================================================================
  /**
   * @internal
   * Loads Value from Storage
   * @param storageItemKey - Storage key of the persisted Instance.
   * | default = Persistent.key |
   * @return Success?
   */
  public async loadPersistedValue(
    storageItemKey?: PersistentKey
  ): Promise<boolean> {
    LogCodeManager.log('00:03:00', ['loadPersistedValue', 'Persistent']);
    return false;
  }

  //=========================================================================================================
  // Update Value
  //=========================================================================================================
  /**
   * @internal
   * Saves/Updates Value in Storage
   * @param storageItemKey - Storage key of the persisted Instance.
   * | default = Persistent.key |
   * @return Success?
   */
  public async persistValue(storageItemKey?: PersistentKey): Promise<boolean> {
    LogCodeManager.log('00:03:00', ['persistValue', 'Persistent']);
    return false;
  }

  //=========================================================================================================
  // Remove Value
  //=========================================================================================================
  /**
   * @internal
   * Removes Value form Storage
   * @param storageItemKey - Storage key of the persisted Instance.
   * | default = Persistent.key |
   * @return Success?
   */
  public async removePersistedValue(
    storageItemKey?: PersistentKey
  ): Promise<boolean> {
    LogCodeManager.log('00:03:00', ['removePersistedValue', 'Persistent']);
    return false;
  }

  //=========================================================================================================
  // Format Key
  //=========================================================================================================
  /**
   * @internal
   * Validates Storage Key
   * @param key - Key that gets validated
   */
  public formatKey(key?: PersistentKey): PersistentKey | undefined {
    return key;
  }
}

export type PersistentKey = string | number;

/**
 * @param key - Key/Name of Persistent
 * @param storageKeys - Keys of Storages in that the persisted Value gets saved
 * @param defaultStorage - Default Storage Key
 * @param instantiate - If Persistent gets Instantiated immediately
 */
export interface CreatePersistentConfigInterface {
  key?: PersistentKey;
  storageKeys?: StorageKey[];
  defaultStorageKey?: StorageKey;
  instantiate?: boolean;
}

/**
 * @param defaultStorageKey - Default Storage Key
 */
export interface PersistentConfigInterface {
  defaultStorageKey: StorageKey | null;
}

/**
 * @param key - Key/Name of Persistent
 * @param storageKeys - Keys of Storages in that the persisted Value gets saved
 * @param defaultStorageKey - Default Storage Key (if not provided it takes the first index of storageKeys or the AgileTs default Storage)
 */
export interface InstantiatePersistentConfigInterface {
  key?: PersistentKey;
  storageKeys?: StorageKey[];
  defaultStorageKey?: StorageKey;
}
