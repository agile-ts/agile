import {
  Agile,
  copy,
  defineConfig,
  LogCodeManager,
  StorageKey,
} from '../internal';

export class Persistent {
  // Agile Instance the Persistent belongs to
  public agileInstance: () => Agile;

  public static placeHolderKey = '__THIS_IS_A_PLACEHOLDER__';

  public config: PersistentConfigInterface;

  // Key/Name identifier of the Persistent
  public _key: PersistentKey;
  // Whether the Persistent is ready and is allowed to persist values
  public ready = false;
  // Whether the Persistent value is stored in the corresponding Storage/s
  public isPersisted = false;
  // Callback that is called when the persisted value was loaded into the Persistent for the first time
  public onLoad: ((success: boolean) => void) | undefined;

  // Key/Name identifier of the Storages the Persistent value is stored in
  public storageKeys: StorageKey[] = [];

  /**
   * A Persistent manages the permanent persistence
   * of an Agile Class such as the `State Class` in external Storages.
   *
   * Note that the Persistent itself is no standalone class
   * and should be adapted to the Agile Class needs it belongs to.
   *
   * @internal
   * @param agileInstance - Instance of Agile the Persistent belongs to.
   * @param config - Configuration object
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
   * Updates the key/name identifier of the Persistent.
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

    // Try to initial load value if Persistent hasn't been ready before
    if (!wasReady) {
      if (isValid) await this.initialLoading();
      return;
    }

    // Remove persisted value that is located at the old key
    await this.removePersistedValue(oldKey);

    // Persist value at the new key
    if (isValid) await this.persistValue(value);
  }

  /**
   * Instantiates the Persistent by assigning the specified Storage keys
   * and validating the Persistent.
   *
   * This was moved out of the `constructor`
   * because some classes that extend the Persistent need to configure some
   * things before they can properly instantiate the parent Persistent.
   *
   * @internal
   * @param config - Configuration object
   */
  public instantiatePersistent(
    config: InstantiatePersistentConfigInterface = {}
  ) {
    this._key = this.formatKey(config.key) ?? Persistent.placeHolderKey;
    this.assignStorageKeys(config.storageKeys, config.defaultStorageKey);
    this.validatePersistent();
  }

  /**
   * Returns a boolean indicating whether the Persistent was setup correctly
   * and is able to persist a value permanently in an external Storage.
   *
   * Based on this tapped boolean value,
   * the Persistent's `ready` property is updated.
   *
   * @internal
   */
  public validatePersistent(): boolean {
    let isValid = true;

    // Validate Persistent key/name identifier
    if (this._key === Persistent.placeHolderKey) {
      LogCodeManager.log('12:03:00');
      isValid = false;
    }

    // Validate Storage keys
    if (!this.config.defaultStorageKey || this.storageKeys.length <= 0) {
      LogCodeManager.log('12:03:01');
      isValid = false;
    }

    // Check if the Storages exist at the specified Storage keys
    this.storageKeys.map((key) => {
      if (!this.agileInstance().storages.storages[key]) {
        LogCodeManager.log('12:03:02', [this._key, key]);
        isValid = false;
      }
    });

    this.ready = isValid;
    return isValid;
  }

  /**
   * Assigns the specified Storage keys to the Persistent
   * and overwrites the old ones.
   *
   *
   * @internal
   * @param storageKeys - Key/Name identifiers to be assigned.
   * @param defaultStorageKey - Key/Name identifier of the default Storage.
   */
  public assignStorageKeys(
    storageKeys: StorageKey[] = [],
    defaultStorageKey?: StorageKey
  ): void {
    const storages = this.agileInstance().storages;
    const _storageKeys = copy(storageKeys);

    // Assign specified default Storage key to the 'storageKeys' array
    if (defaultStorageKey && !_storageKeys.includes(defaultStorageKey))
      _storageKeys.push(defaultStorageKey);

    // Assign default Storage of AgileTs to the `storageKeys' array
    // and assign it as default Storage key of the Persistent
    // if no valid 'storageKeys' were provided
    if (_storageKeys.length <= 0) {
      this.config.defaultStorageKey = storages.config.defaultStorageKey as any;
      _storageKeys.push(storages.config.defaultStorageKey as any);
    } else {
      this.config.defaultStorageKey = defaultStorageKey || _storageKeys[0];
    }

    this.storageKeys = _storageKeys;
  }

  /**
   * Stores or loads the Persistent value from the external Storages for the first time.
   *
   * @internal
   */
  public async initialLoading(): Promise<void> {
    const success = await this.loadPersistedValue();
    if (this.onLoad) this.onLoad(success);
    if (!success) await this.persistValue();
  }

  /**
   * Loads the Persistent value from the corresponding Storage.
   *
   * Note that this method should be overwritten
   * to correctly apply the changes to the Agile Class
   * the Persistent belongs to.
   *
   * @internal
   * @param storageItemKey - Storage key of the persisted value.
   * | default = Persistent.key |
   * @return Whether loading of the persisted value was successful.
   */
  public async loadPersistedValue(
    storageItemKey?: PersistentKey
  ): Promise<boolean> {
    LogCodeManager.log('00:03:00', ['loadPersistedValue', 'Persistent']);
    return false;
  }

  /**
   * Persists the Persistent value in the corresponding Storage.
   *
   * Note that this method should be overwritten
   * to correctly apply the changes to the Agile Class
   * the Persistent belongs to.
   *
   * @internal
   * @param storageItemKey - Storage key of the persisted value
   * | default = Persistent.key |
   * @return Whether the persisting of the value was successful.
   */
  public async persistValue(storageItemKey?: PersistentKey): Promise<boolean> {
    LogCodeManager.log('00:03:00', ['persistValue', 'Persistent']);
    return false;
  }

  /**
   * Removes the Persistent value from the corresponding Storage.
   * -> Persistent value is no longer persisted
   *
   * Note that this method should be overwritten
   * to correctly apply the changes to the Agile Class
   * the Persistent belongs to.
   *
   * @internal
   * @param storageItemKey - Storage key of the persisted value.
   * | default = Persistent.key |
   * @return Whether the removal of the persisted value was successful.
   */
  public async removePersistedValue(
    storageItemKey?: PersistentKey
  ): Promise<boolean> {
    LogCodeManager.log('00:03:00', ['removePersistedValue', 'Persistent']);
    return false;
  }

  /**
   * Formats the specified key so that it can be used as a valid Storage key
   * and returns the formatted variant of it.
   *
   * Note that this method should be overwritten
   * to correctly apply the changes to the Agile Class
   * the Persistent belongs to.
   *
   * @internal
   * @param key - Key to be formatted.
   */
  public formatKey(key?: PersistentKey): PersistentKey | undefined {
    return key;
  }
}

export type PersistentKey = string | number;

export interface CreatePersistentConfigInterface {
  /**
   * Key/Name identifier of the Persistent.
   */
  key?: PersistentKey;
  /**
   * Key/Name identifier of Storages
   * in which the Persistent value should be or is persisted.
   * @default [`defaultStorageKey`]
   */
  storageKeys?: StorageKey[];
  /**
   * Key/Name identifier of the default Storage of the specified Storage keys.
   *
   * The Persistent value is loaded from the default Storage by default
   * and is only loaded from the remaining Storages (`storageKeys)
   * if the loading from the default Storage failed.
   *
   * @default first index of the specified Storage keys or the AgileTs default Storage key
   */
  defaultStorageKey?: StorageKey;
  /**
   * Whether the Persistent should be instantiated immediately
   * or whether this should be done manually.
   * @default true
   */
  instantiate?: boolean;
}

export interface PersistentConfigInterface {
  /**
   * Key/Name identifier of the default Storage of the specified Storage keys.
   *
   * The Persistent value is loaded from the default Storage by default
   * and is only loaded from the remaining Storages (`storageKeys)
   * if the loading from the default Storage failed.
   *
   * @default first index of the specified Storage keys or the AgileTs default Storage key
   */
  defaultStorageKey: StorageKey | null;
}

export interface InstantiatePersistentConfigInterface {
  /**
   * Key/Name identifier of the Persistent.
   */
  key?: PersistentKey;
  /**
   * Key/Name identifier of Storages
   * in which the Persistent value should be or is persisted.
   * @default [`defaultStorageKey`]
   */
  storageKeys?: StorageKey[];
  /**
   * Key/Name identifier of the default Storage of the specified Storage keys.
   *
   * The Persistent value is loaded from the default Storage by default
   * and is only loaded from the remaining Storages (`storageKeys)
   * if the loading from the default Storage failed.
   *
   * @default first index of the specified Storage keys or the AgileTs default Storage key
   */
  defaultStorageKey?: StorageKey;
}
