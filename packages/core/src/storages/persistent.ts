import {
  Agile,
  copy,
  defineConfig,
  LoggingHandler,
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
        'No valid persist Key found! Provide a valid key or assign one to the parent instance.'
      );
      isValid = false;
    }

    // Validate StorageKeys
    if (!this.config.defaultStorageKey || this.storageKeys.length <= 0) {
      Agile.logger.error(
        'No persist Storage Key found! Please specify at least one Storage Key.'
      );
      isValid = false;
    }

    // Check if Storages exist
    this.storageKeys.map((key) => {
      if (!this.agileInstance().storages.storages[key]) {
        Agile.logger.error(`Couldn't validate Persistent '${this._key}'. 
      The Storage with the key/name '${key}' doesn't exists!`);
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
    if (defaultStorageKey && !_storageKeys.includes(defaultStorageKey)) {
      _storageKeys.push(defaultStorageKey);
    }

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
   * @return Success?
   */
  public async loadPersistedValue(): Promise<boolean> {
    Agile.logger.error(
      `The 'loadPersistedValue()' method isn't set in Persistent but need to be set! Persistent is no stand alone class.`
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
      `The 'persistValue()' method isn't set in Persistent but need to be set! Persistent is no stand alone class.`
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
      `The 'removePersistedValue()' method isn't set in Persistent but need to be set! Persistent is no stand alone class.`
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
