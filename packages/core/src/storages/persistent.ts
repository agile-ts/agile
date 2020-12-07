import { Agile, defineConfig, StorageKey } from "../internal";

export class Persistent<ValueType = any> {
  public agileInstance: () => Agile;

  public static placeHolderKey = "__THIS_IS_A_PLACEHOLDER__";

  public _key: PersistentKey;
  public ready = false;
  public isPersisted: boolean = false; // If Value is stored in Agile Storage
  public onLoad: ((success: boolean) => void) | undefined; // Gets called if PersistValue got loaded for the first Time

  // StorageKeys of Storages in that the Persisted Value gets saved
  public storageKeys: StorageKey[] = [];
  public defaultStorageKey: StorageKey | undefined;

  /**
   * @internal
   * Persistent - Handles storing of Agile Instances
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
    });
    this.agileInstance().storages.persistentInstances.add(this);
    if (config.instantiate)
      this.instantiatePersistent({
        storageKeys: config.storageKeys,
        key: config.key,
      });
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
  public instantiatePersistent(config: PersistentConfigInterface = {}) {
    this._key = this.formatKey(config.key) || Persistent.placeHolderKey;
    this.assignStorageKeys(config.storageKeys);
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
    // Validate Key
    if (this._key === Persistent.placeHolderKey) {
      Agile.logger.error(
        "No valid persist Key found! Please provide a Key or assign one to the parent instance."
      );
      return false;
    }

    // Validate StorageKeys
    if (!this.defaultStorageKey || this.storageKeys.length <= 0) {
      Agile.logger.error(
        "No persist Storage Key found! Please provide at least one Storage Key."
      );
      return false;
    }

    this.ready = true;
    return true;
  }

  //=========================================================================================================
  // Assign StorageKeys
  //=========================================================================================================
  /**
   * @internal
   * Assign new StorageKeys to Persistent and overwrite the old ones
   * @param storageKeys - New Storage Keys
   */
  public assignStorageKeys(storageKeys?: StorageKey[]) {
    const storages = this.agileInstance().storages;

    // Set default Agile Storage to defaultStorage if no storageKey provided
    if (!storageKeys || storageKeys.length <= 0) {
      this.storageKeys = [];
      if (storages.defaultStorage) {
        const key = storages.defaultStorage.key;
        this.defaultStorageKey = key;
        this.storageKeys.push(key);
      }
      return;
    }

    this.storageKeys = storageKeys;
    this.defaultStorageKey = storageKeys[0];
  }

  //=========================================================================================================
  // Initial Loading
  //=========================================================================================================
  /**
   * @internal
   * Loads/Saves Storage Value for the first Time
   */
  public async initialLoading() {
    const success = await this.loadValue();
    if (this.onLoad) this.onLoad(success);
    if (!success) await this.updateValue();
  }

  //=========================================================================================================
  // Load Value
  //=========================================================================================================
  /**
   * @internal
   * Loads Value from Storage
   * @return Success?
   */
  public async loadValue(key?: PersistentKey): Promise<boolean> {
    Agile.logger.error(
      `Load Value function isn't Set in Persistent! Be aware that Persistent is no stand alone class!`
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
  public async updateValue(key?: PersistentKey): Promise<boolean> {
    Agile.logger.error(
      `Update Value function isn't Set in Persistent! Be aware that Persistent is no stand alone class!`
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
  public async removeValue(key?: PersistentKey): Promise<boolean> {
    Agile.logger.error(
      `Remove Value function isn't Set in Persistent! Be aware that Persistent is no stand alone class!`
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
 * @param instantiate - If Persistent gets Instantiated immediately
 */
export interface CreatePersistentConfigInterface {
  key?: PersistentKey;
  storageKeys?: StorageKey[];
  instantiate?: boolean;
}

/**
 * @param key - Key/Name of Persistent
 * @param storageKeys - Keys of Storages in that the persisted Value gets saved
 */
export interface PersistentConfigInterface {
  key?: PersistentKey;
  storageKeys?: StorageKey[];
}
