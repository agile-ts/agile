import { Agile } from '../agile';
import { Persistent } from './persistent';
import { defineConfig, notEqual } from '@agile-ts/utils';
import { LogCodeManager } from '../logCodeManager';
import { Storage, StorageItemKey, StorageKey } from './storage';

export class Storages {
  // Agile Instance the Storages belongs to
  public agileInstance: () => Agile;

  public config: StoragesConfigInterface;

  // Registered Storages
  public storages: { [key: string]: Storage } = {};
  // Persistent from Instances (for example States) that were persisted
  public persistentInstances: Set<Persistent> = new Set();

  /**
   * The Storages Class manages all external Storages for an Agile Instance
   * and provides an interface to easily store,
   * load and remove values from multiple Storages at once.
   *
   * @internal
   * @param agileInstance - Instance of Agile the Storages belongs to.
   * @param config - Configuration object
   */
  constructor(
    agileInstance: Agile,
    config: CreateStoragesConfigInterface = {}
  ) {
    this.agileInstance = () => agileInstance;
    config = defineConfig(config, {
      localStorage: false,
      defaultStorageKey: null as any,
    });
    this.config = { defaultStorageKey: config.defaultStorageKey as any };
    if (config.localStorage) this.instantiateLocalStorage();
  }

  /**
   * Instantiates and registers the
   * [Local Storage](https://developer.mozilla.org/de/docs/Web/API/Window/localStorage).
   *
   * Note that the Local Storage is only available in a web environment.
   *
   * @internal
   */
  public instantiateLocalStorage(): boolean {
    if (!Storages.localStorageAvailable()) {
      LogCodeManager.log('11:02:00');
      return false;
    }
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

  /**
   * Registers the specified Storage with AgileTs
   * and updates the Persistent Instances that have already attempted
   * to use the previously unregistered Storage.
   *
   * @public
   * @param storage - Storage to be registered with AgileTs.
   * @param config - Configuration object
   */
  public register(
    storage: Storage,
    config: RegisterConfigInterface = {}
  ): boolean {
    const hasRegisteredAnyStorage = notEqual(this.storages, {});

    // Check if Storage already exists
    if (Object.prototype.hasOwnProperty.call(this.storages, storage.key)) {
      LogCodeManager.log('11:03:00', [storage.key]);
      return false;
    }

    // Assign Storage as default Storage if it is the first one added
    if (!hasRegisteredAnyStorage && config.default === false)
      LogCodeManager.log('11:02:01');
    if (!hasRegisteredAnyStorage) config.default = true;

    // Register Storage
    this.storages[storage.key] = storage;
    if (config.default) this.config.defaultStorageKey = storage.key;

    this.persistentInstances.forEach((persistent) => {
      // Revalidate Persistent, which contains key/name identifier of the newly registered Storage
      if (persistent.storageKeys.includes(storage.key)) {
        const isValid = persistent.validatePersistent();
        if (isValid) persistent.initialLoading();
        return;
      }

      // If Persistent has no default Storage key,
      // reassign Storage keys since the now registered Storage
      // might be tagged as default Storage of AgileTs
      if (persistent.config.defaultStorageKey == null) {
        persistent.assignStorageKeys();
        const isValid = persistent.validatePersistent();
        if (isValid) persistent.initialLoading();
      }
    });

    LogCodeManager.log('13:00:00', [storage.key], storage);

    return true;
  }

  /**
   * Retrieves a single Storage with the specified key/name identifier
   * from the Storages Class.
   *
   * If the to retrieve Storage doesn't exist, `undefined` is returned.
   *
   * @public
   * @param storageKey - Key/Name identifier of the Storage.
   */
  public getStorage(
    storageKey: StorageKey | undefined | null
  ): Storage | undefined {
    if (!storageKey) return undefined;
    const storage = this.storages[storageKey];
    if (!storage) {
      LogCodeManager.log('11:03:01', [storageKey]);
      return undefined;
    }
    if (!storage.ready) {
      LogCodeManager.log('11:03:02', [storageKey]);
      return undefined;
    }
    return storage;
  }

  /**
   * Retrieves the stored value at the specified Storage Item key
   * from the defined external Storage (`storageKey`).
   *
   * When no Storage has been specified,
   * the value is retrieved from the default Storage.
   *
   * @public
   * @param storageItemKey - Key/Name identifier of the value to be retrieved.
   * @param storageKey - Key/Name identifier of the external Storage
   * from which the value is to be retrieved.
   */
  public get<GetType = any>(
    storageItemKey: StorageItemKey,
    storageKey?: StorageKey
  ): Promise<GetType | undefined> {
    if (!this.hasStorage()) {
      LogCodeManager.log('11:03:03');
      return Promise.resolve(undefined);
    }

    // Call get method on specified Storage
    if (storageKey) {
      const storage = this.getStorage(storageKey);
      if (storage) return storage.get<GetType>(storageItemKey);
    }

    // Call get method on default Storage
    const defaultStorage = this.getStorage(this.config.defaultStorageKey);
    return (
      defaultStorage?.get<GetType>(storageItemKey) || Promise.resolve(undefined)
    );
  }

  /**
   * Stores or updates the value at the specified Storage Item key
   * in the defined external Storages (`storageKeys`).
   *
   * When no Storage has been specified,
   * the value is stored/updated in the default Storage.
   *
   * @public
   * @param storageItemKey - Key/Name identifier of the value to be stored.
   * @param value - Value to be stored in an external Storage.
   * @param storageKeys - Key/Name identifier of the external Storage
   * where the value is to be stored.
   */
  public set(
    storageItemKey: StorageItemKey,
    value: any,
    storageKeys?: StorageKey[]
  ): void {
    if (!this.hasStorage()) {
      LogCodeManager.log('11:03:04');
      return;
    }

    // Call set method on specified Storages
    if (storageKeys != null) {
      for (const storageKey of storageKeys)
        this.getStorage(storageKey)?.set(storageItemKey, value);
      return;
    }

    // Call set method on default Storage
    const defaultStorage = this.getStorage(this.config.defaultStorageKey);
    defaultStorage?.set(storageItemKey, value);
  }

  /**
   * Removes the value at the specified Storage Item key
   * from the defined external Storages (`storageKeys`).
   *
   * When no Storage has been specified,
   * the value is removed from the default Storage.
   *
   * @public
   * @param storageItemKey - Key/Name identifier of the value to be removed.
   * @param storageKeys - Key/Name identifier of the external Storage
   * from which the value is to be removed.
   */
  public remove(
    storageItemKey: StorageItemKey,
    storageKeys?: StorageKey[]
  ): void {
    if (!this.hasStorage()) {
      LogCodeManager.log('11:03:05');
      return;
    }

    // Call remove method on specified Storages
    if (storageKeys) {
      for (const storageKey of storageKeys)
        this.getStorage(storageKey)?.remove(storageItemKey);
      return;
    }

    // Call remove method on default Storage
    const defaultStorage = this.getStorage(this.config.defaultStorageKey);
    defaultStorage?.remove(storageItemKey);
  }

  /**
   * Returns a boolean indicating whether any Storage
   * has been registered with the Agile Instance or not.
   *
   * @public
   */
  public hasStorage(): boolean {
    return notEqual(this.storages, {});
  }

  /**
   * Returns a boolean indication whether the
   * [Local Storage](https://developer.mozilla.org/de/docs/Web/API/Window/localStorage)
   * is available in the current environment.
   *
   * @public
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

export interface CreateStoragesConfigInterface {
  /**
   * Whether to register the Local Storage by default.
   * Note that the Local Storage is only available in a web environment.
   * @default false
   */
  localStorage?: boolean;
  /**
   * Key/Name identifier of the default Storage.
   *
   * The default Storage represents the default Storage of the Storages Class,
   * on which executed actions are performed if no specific Storage was specified.
   *
   * Also, the persisted value is loaded from the default Storage by default,
   * since only one persisted value can be applied.
   * If the loading of the value from the default Storage failed,
   * an attempt is made to load the value from the remaining Storages.
   *
   * @default undefined
   */
  defaultStorageKey?: StorageKey;
}

export interface StoragesConfigInterface {
  /**
   * Key/Name identifier of the default Storage.
   *
   * The default Storage represents the default Storage of the Storages Class,
   * on which executed actions are performed if no specific Storage was specified.
   *
   * Also, the persisted value is loaded from the default Storage by default,
   * since only one persisted value can be applied.
   * If the loading of the value from the default Storage failed,
   * an attempt is made to load the value from the remaining Storages.
   *
   * @default undefined
   */
  defaultStorageKey: StorageKey | null;
}

export interface RegisterConfigInterface {
  /**
   * Whether the to register Storage should become the default Storage.
   *
   * The default Storage represents the default Storage of the Storages Class,
   * on which executed actions are performed if no specific Storage was specified.
   *
   * Also, the persisted value is loaded from the default Storage by default,
   * since only one persisted value can be applied.
   * If the loading of the value from the default Storage failed,
   * an attempt is made to load the value from the remaining Storages.
   *
   * @default false
   */
  default?: boolean;
}
