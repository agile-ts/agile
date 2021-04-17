import { Agile, copy, defineConfig, StorageKey } from '../internal';

export class Persistent {
  public agileInstance: () => Agile;

  public static placeHolderKey = '__THIS_IS_A_PLACEHOLDER__';
  public config: PersistentConfigInterface;

  public _key: PersistentKey;
  public ready = false;
  public isPersisted = false; // If Value is stored in Agile Storage
  public onLoad: ((success: boolean) => void) | undefined; // Gets called if PersistValue got loaded for the first Time

  // StorageKeys of Storages in that the Persisted Value gets saved
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
   * @internal
   * Set Key/Name of Persistent
   */
  public set key(value: StorageKey) {
    this.setKey(value);
  }

  /**
   * @internal
   * Get Key/Name of Persistent
   */
  public get key(): StorageKey {
    return this._key;
  }

  //=========================================================================================================
  // Set Key
  //=========================================================================================================
  /**
   * @public
   * Sets Key/Name of Persistent
   * @param value - New Key/Name of Persistent
   */
  public setKey(value: StorageKey): void {
    this._key = value;
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
    this._key = this.formatKey(config.key) || Persistent.placeHolderKey;
    console.log(config.storageKeys, config.defaultStorageKey);
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
      Agile.logger.error(
        'No valid persist Key found! Please provide a Key or assign one to the parent instance.'
      );
      isValid = false;
    }

    // Validate StorageKeys
    if (!this.config.defaultStorageKey || this.storageKeys.length <= 0) {
      Agile.logger.error(
        'No persist Storage Key found! Please provide at least one Storage Key.'
      );
      isValid = false;
    }

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
  ) {
    const storages = this.agileInstance().storages;
    const _storageKeys = copy(storageKeys);

    // Print warning if default StorageKey passed, but it isn't in stoargeKeys
    if (defaultStorageKey && _storageKeys.includes(defaultStorageKey)) {
      Agile.logger.warn(
        `Default Storage Key '${defaultStorageKey}' isn't contained in storageKeys!`,
        _storageKeys
      );
      _storageKeys.push(defaultStorageKey);
    }

    // Add default Storage of AgileTs if no storageKey provided
    if (_storageKeys.length <= 0) {
      const _defaultStorageKey =
        defaultStorageKey || storages.config.defaultStorageKey;
      if (_defaultStorageKey) {
        this.config.defaultStorageKey = _defaultStorageKey;
        this.storageKeys.push(_defaultStorageKey);
      }
      return;
    }

    this.storageKeys = _storageKeys;
    this.config.defaultStorageKey = defaultStorageKey || _storageKeys[0];
  }

  //=========================================================================================================
  // Initial Loading
  //=========================================================================================================
  /**
   * @internal
   * Loads/Saves Storage Value for the first Time
   */
  public async initialLoading() {
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
   * @return Success?
   */
  public async loadPersistedValue(): Promise<boolean> {
    Agile.logger.error(
      `'loadPersistedValue' function isn't Set in Persistent! Be aware that Persistent is no stand alone class!`
    );
    return false;
  }

  //=========================================================================================================
  // Update Value
  //=========================================================================================================
  /**
   * @internal
   * Saves/Updates Value in Storage
   * @return Success?
   */
  public async persistValue(): Promise<boolean> {
    Agile.logger.error(
      `'persistValue' function isn't Set in Persistent! Be aware that Persistent is no stand alone class!`
    );
    return false;
  }

  //=========================================================================================================
  // Remove Value
  //=========================================================================================================
  /**
   * @internal
   * Removes Value form Storage
   * @return Success?
   */
  public async removePersistedValue(): Promise<boolean> {
    Agile.logger.error(
      `'removePersistedValue' function isn't Set in Persistent! Be aware that Persistent is no stand alone class!`
    );
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
 * @param defaultStorage - Default Storage Key
 */
export interface PersistentConfigInterface {
  defaultStorageKey: StorageKey | null;
}

/**
 * @param key - Key/Name of Persistent
 * @param storageKeys - Keys of Storages in that the persisted Value gets saved
 * @param defaultStorage - Default Storage Key
 */
export interface InstantiatePersistentConfigInterface {
  key?: PersistentKey;
  storageKeys?: StorageKey[];
  defaultStorageKey?: StorageKey;
}
