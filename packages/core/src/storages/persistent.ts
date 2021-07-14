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
  // Whether the Persistent is ready
  // and is able to persist values in an external Storage
  public ready = false;
  // Whether the Persistent value is stored in a corresponding external Storage/s
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
      defaultStorageKey: null as any,
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
   * Instantiates the Persistent by assigning the specified Storage keys to it
   * and validating it to make sure everything was setup correctly.
   *
   * This was moved out of the `constructor()`
   * because some classes (that extend the Persistent) need to configure some
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
   * Based on the tapped boolean value,
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
    if (this.config.defaultStorageKey == null || this.storageKeys.length <= 0) {
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
   * Assigns the specified Storage identifiers to the Persistent
   * and extracts the default Storage if necessary.
   *
   * When no Storage key was provided the default Storage
   * of the Agile Instance is applied to the Persistent.
   *
   * @internal
   * @param storageKeys - Key/Name identifier of the Storages to be assigned.
   * @param defaultStorageKey - Key/Name identifier of the default Storage.
   */
  public assignStorageKeys(
    storageKeys: StorageKey[] = [],
    defaultStorageKey?: StorageKey
  ): void {
    const storages = this.agileInstance().storages;
    const _storageKeys = copy(storageKeys);

    // Assign specified default Storage key to the 'storageKeys' array
    if (defaultStorageKey != null && !_storageKeys.includes(defaultStorageKey))
      _storageKeys.push(defaultStorageKey);

    // Assign the default Storage key of the Agile Instance to the 'storageKeys' array
    // and specify it as the Persistent's default Storage key
    // if no valid Storage key was provided
    if (_storageKeys.length <= 0) {
      const defaultStorageKey = storages.config.defaultStorageKey;
      if (defaultStorageKey != null) {
        this.config.defaultStorageKey = defaultStorageKey;
        _storageKeys.push(storages.config.defaultStorageKey as any);
      }
    } else {
      this.config.defaultStorageKey = defaultStorageKey ?? _storageKeys[0];
    }

    this.storageKeys = _storageKeys;
  }

  /**
   * Stores or loads the Persistent value
   * from the external Storages for the first time.
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
   * @param storageItemKey - Storage key of the to load value.
   * | default = Persistent.key |
   * @return Whether the loading of the persisted value was successful.
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
   * @param storageItemKey - Storage key of the to persist value
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
   * @param storageItemKey - Storage key of the to remove value.
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
   * @param key - Storage key to be formatted.
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
   * in which the Persistent value is to be persisted
   * or is already persisted.
   * @default [`defaultStorageKey`]
   */
  storageKeys?: StorageKey[];
  /**
   * Key/Name identifier of the default Storage of the specified Storage keys.
   *
   * The persisted value is loaded from the default Storage by default,
   * since only one persisted value can be applied.
   * If the loading of the value from the default Storage failed,
   * an attempt is made to load the value from the remaining Storages.
   *
   * @default first index of the specified Storage keys or the Agile Instance's default Storage key
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
   * The persisted value is loaded from the default Storage by default,
   * since only one persisted value can be applied.
   * If the loading of the value from the default Storage failed,
   * an attempt is made to load the value from the remaining Storages.
   *
   * @default first index of the specified Storage keys or the Agile Instance's default Storage key
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
   * in which the Persistent value is to be persisted
   * or is already persisted.
   * @default [`defaultStorageKey`]
   */
  storageKeys?: StorageKey[];
  /**
   * Key/Name identifier of the default Storage of the specified Storage keys.
   *
   * The persisted value is loaded from the default Storage by default,
   * since only one persisted value can be applied.
   * If the loading of the value from the default Storage failed,
   * an attempt is made to load the value from the remaining Storages.
   *
   * @default first index of the specified Storage keys or the Agile Instance's default Storage key
   */
  defaultStorageKey?: StorageKey;
}
