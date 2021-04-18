import {
  Agile,
  Storage,
  defineConfig,
  Persistent,
  StorageKey,
  StorageItemKey,
  notEqual,
} from '../internal';

export class Storages {
  public agileInstance: () => Agile;

  public config: StoragesConfigInterface;
  public storages: { [key: string]: Storage } = {}; // All registered Storages
  public persistentInstances: Set<Persistent> = new Set();

  /**
   * @internal
   * Storages - Manages Storages of Agile
   * @param agileInstance - An Instance of Agile
   * @param config - Config
   */
  constructor(
    agileInstance: Agile,
    config: CreateStoragesConfigInterface = {}
  ) {
    this.agileInstance = () => agileInstance;
    config = defineConfig(config, {
      localStorage: false,
      defaultStorageKey: null,
    });
    this.config = { defaultStorageKey: config.defaultStorageKey as any };
    if (config.localStorage) this.instantiateLocalStorage();
  }

  //=========================================================================================================
  // Instantiate Local Storage
  //=========================================================================================================
  /**
   * @internal
   * Instantiates Local Storage
   */
  public instantiateLocalStorage(): boolean {
    // Check if Local Storage is Available
    if (!Storages.localStorageAvailable()) {
      Agile.logger.warn(
        'Local Storage is here not available, to use Storage functionalities like persist please provide a custom Storage!'
      );
      return false;
    }

    // Create and register Local Storage
    const _localStorage = new Storage({
      key: 'localStorage',
      async: false,
      methods: {
        get: localStorage.getItem.bind(localStorage),
        set: localStorage.setItem.bind(localStorage),
        remove: localStorage.removeItem.bind(localStorage),
      },
    });
    return this.register(_localStorage, { default: true });
  }

  //=========================================================================================================
  // Register
  //=========================================================================================================
  /**
   * @internal
   * Register new Storage as Agile Storage
   * @param storage - new Storage
   * @param config - Config
   */
  public register(
    storage: Storage,
    config: RegisterConfigInterface = {}
  ): boolean {
    const hasRegisteredAnyStorage = notEqual(this.storages, {});

    // Check if Storage already exists
    if (Object.prototype.hasOwnProperty.call(this.storages, storage.key)) {
      Agile.logger.error(
        `Storage with the key/name '${storage.key}' already exists`
      );
      return false;
    }

    // Set first added Storage as default Storage
    if (!hasRegisteredAnyStorage && config.default === false) {
      Agile.logger.warn(
        'Be aware that Agile has to assign the first added Storage as default Storage!'
      );
    }
    if (!hasRegisteredAnyStorage) config.default = true;

    // Register Storage
    this.storages[storage.key] = storage;
    if (config.default) this.config.defaultStorageKey = storage.key;

    this.persistentInstances.forEach((persistent) => {
      if (persistent.storageKeys.includes(storage.key)) {
        // If Persistent isn't ready (try to revalidate and load it)
        if (!persistent.ready) {
          const isValid = persistent.validatePersistent();
          if (isValid) persistent.initialLoading();
          return;
        }

        // Add Value of Persistent to newly registered Storage
        persistent.persistValue();
      }
    });

    return true;
  }

  //=========================================================================================================
  // Get Storage
  //=========================================================================================================
  /**
   * @internal
   * Get Storage at Key/Name
   * @param storageKey - Key/Name of Storage
   */
  public getStorage(
    storageKey: StorageKey | undefined | null
  ): Storage | undefined {
    if (!storageKey) return undefined;
    const storage = this.storages[storageKey];

    // Check if Storage exists
    if (!storage) {
      Agile.logger.error(
        `Storage with the key/name '${storageKey}' doesn't exist!`
      );
      return undefined;
    }

    // Check if Storage is ready
    if (!storage.ready) {
      Agile.logger.error(
        `Storage with the key/name '${storageKey}' isn't ready yet!`
      );
      return undefined;
    }

    return storage;
  }

  //=========================================================================================================
  // Get
  //=========================================================================================================
  /**
   * @internal
   * Gets value at provided Key
   * @param key - Key of Storage property
   * @param storageKey - Key/Name of Storage from which the Item is fetched (if not provided default Storage will be used)
   */
  public get<GetType = any>(
    key: StorageItemKey,
    storageKey?: StorageKey
  ): Promise<GetType | undefined> {
    if (!this.hasStorage()) {
      Agile.logger.error(
        'No Storage found! Please provide at least one Storage.'
      );
      return Promise.resolve(undefined);
    }

    // Call get Method in specific Storage
    if (storageKey) {
      const storage = this.getStorage(storageKey);
      if (storage) return storage.get<GetType>(key);
    }

    // Call get Method in default Storage
    const defaultStorage = this.getStorage(this.config.defaultStorageKey);
    return defaultStorage?.get<GetType>(key) || Promise.resolve(undefined);
  }

  //=========================================================================================================
  // Set
  //=========================================================================================================
  /**
   * @internal
   * Saves/Updates value at provided Key
   * @param key - Key of Storage property
   * @param value - new Value that gets set at provided Key
   * @param storageKeys - Key/Name of Storages where the Value gets set (if not provided default Storage will be used)
   */
  public set(
    key: StorageItemKey,
    value: any,
    storageKeys?: StorageKey[]
  ): void {
    if (!this.hasStorage()) {
      Agile.logger.error(
        'No Storage found! Please provide at least one Storage.'
      );
      return;
    }

    // Call set Method in specific Storages
    if (storageKeys) {
      for (const storageKey of storageKeys)
        this.getStorage(storageKey)?.set(key, value);
      return;
    }

    // Call set Method in default Storage
    const defaultStorage = this.getStorage(this.config.defaultStorageKey);
    defaultStorage?.set(key, value);
  }

  //=========================================================================================================
  // Remove
  //=========================================================================================================
  /**
   * @internal
   * Removes value at provided Key
   * @param key - Key of Storage property
   * @param storageKeys - Key/Name of Storages where the Value gets removed (if not provided default Storage will be used)
   */
  public remove(key: StorageItemKey, storageKeys?: StorageKey[]): void {
    if (!this.hasStorage()) {
      Agile.logger.error(
        'No Storage found! Please provide at least one Storage.'
      );
      return;
    }

    // Call remove Method in specific Storages
    if (storageKeys) {
      for (const storageKey of storageKeys)
        this.getStorage(storageKey)?.remove(key);
      return;
    }

    // Call remove Method in default Storage
    const defaultStorage = this.getStorage(this.config.defaultStorageKey);
    defaultStorage?.remove(key);
  }

  //=========================================================================================================
  // Has Storage
  //=========================================================================================================
  /**
   * @internal
   * Check if at least one Storage got registered
   */
  public hasStorage(): boolean {
    return notEqual(this.storages, {});
  }

  //=========================================================================================================
  // Local Storage Available
  //=========================================================================================================
  /**
   * @internal
   * Checks if localStorage is available in this Environment
   */
  static localStorageAvailable(): boolean {
    try {
      localStorage.setItem('_myDummyKey_', 'myDummyValue');
      localStorage.removeItem('_myDummyKey_');
      return true;
    } catch (e) {
      return false;
    }
  }
}

/**
 * @param localStorage - If Local Storage should be instantiated
 * @param defaultStorage - Default Storage Key
 */
export interface CreateStoragesConfigInterface {
  localStorage?: boolean;
  defaultStorageKey?: StorageKey;
}

/**
 * @param defaultStorage - Default Storage Key
 */
export interface StoragesConfigInterface {
  defaultStorageKey: StorageKey | null;
}

/**
 * @param default - If the registered Storage gets the default Storage
 */
export interface RegisterConfigInterface {
  default?: boolean;
}
