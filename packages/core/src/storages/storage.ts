import {
  isJsonString,
  defineConfig,
  isAsyncFunction,
  isFunction,
  Agile,
  LogCodeManager,
} from '../internal';

export class Storage {
  public key: StorageKey;
  public ready = false;
  public methods: StorageMethodsInterface;
  public config: StorageConfigInterface;

  /**
   * @public
   * Storage - Interface for storing Items permanently
   * @param config - Config
   */
  constructor(config: CreateStorageConfigInterface) {
    config = defineConfig(config, {
      prefix: 'agile',
      async: false,
    });
    this.key = config.key;
    this.methods = config.methods;
    this.config = {
      prefix: config.prefix,
      async: config.async,
    };
    this.ready = this.validate();
    if (!this.ready) return;

    // Check if Storage is async
    if (
      isAsyncFunction(this.methods.get) ||
      isAsyncFunction(this.methods.set) ||
      isAsyncFunction(this.methods.remove)
    )
      this.config.async = true;
  }

  //=========================================================================================================
  // Validate
  //=========================================================================================================
  /**
   * @public
   * Validates Storage Methods
   */
  public validate(): boolean {
    if (!isFunction(this.methods?.get)) {
      LogCodeManager.log('13:03:00', ['get']);
      return false;
    }
    if (!isFunction(this.methods?.set)) {
      LogCodeManager.log('13:03:00', ['set']);
      return false;
    }
    if (!isFunction(this.methods?.remove)) {
      LogCodeManager.log('13:03:00', ['remove']);
      return false;
    }
    return true;
  }

  //=========================================================================================================
  // Normal Get
  //=========================================================================================================
  /**
   * @internal
   * Gets value at provided Key (normal)
   * Note: Only use this if you are 100% sure this Storage doesn't work async
   * @param key - Key of Storage property
   */
  public normalGet<GetTpe = any>(key: StorageItemKey): GetTpe | undefined {
    if (!this.ready || !this.methods.get) return undefined;
    if (isAsyncFunction(this.methods.get)) LogCodeManager.log('13:02:00');

    // Get Value
    const res = this.methods.get(this.getStorageKey(key));
    const _res = isJsonString(res) ? JSON.parse(res) : res;

    Agile.logger.if
      .tag(['storage'])
      .info(
        LogCodeManager.getLog('13:01:00', [this.key, this.getStorageKey(key)]),
        _res
      );

    return _res;
  }

  //=========================================================================================================
  // Async Get
  //=========================================================================================================
  /**
   * @internal
   * Gets value at provided Key (async)
   * @param key - Key of Storage property
   */
  public get<GetTpe = any>(key: StorageItemKey): Promise<GetTpe | undefined> {
    if (!this.ready || !this.methods.get) return Promise.resolve(undefined);

    // Get Value in 'dummy' promise if get method isn't async
    if (!isAsyncFunction(this.methods.get))
      return Promise.resolve(this.normalGet(key));

    // Get Value (async)
    return new Promise((resolve, reject) => {
      this.methods
        ?.get(this.getStorageKey(key))
        .then((res: any) => {
          const _res = isJsonString(res) ? JSON.parse(res) : res;

          Agile.logger.if
            .tag(['storage'])
            .info(
              LogCodeManager.getLog('13:01:00', [
                this.key,
                this.getStorageKey(key),
              ]),
              _res
            );

          resolve(_res);
        })
        .catch(reject);
    });
  }

  //=========================================================================================================
  // Set
  //=========================================================================================================
  /**
   * @public
   * Saves/Updates value at provided Key
   * @param key - Key of Storage property
   * @param value - new Value that gets set
   */
  public set(key: StorageItemKey, value: any): void {
    if (!this.ready || !this.methods.set) return;

    Agile.logger.if
      .tag(['storage'])
      .info(
        LogCodeManager.getLog('13:01:01', [this.key, this.getStorageKey(key)]),
        value
      );

    this.methods.set(this.getStorageKey(key), JSON.stringify(value));
  }

  //=========================================================================================================
  // Remove
  //=========================================================================================================
  /**
   * @public
   * Removes value at provided Key
   * @param key - Key of Storage property
   */
  public remove(key: StorageItemKey): void {
    if (!this.ready || !this.methods.remove) return;

    Agile.logger.if
      .tag(['storage'])
      .info(
        LogCodeManager.getLog('13:01:02', [this.key, this.getStorageKey(key)])
      );

    this.methods.remove(this.getStorageKey(key));
  }

  //=========================================================================================================
  // Get Storage Key
  //=========================================================================================================
  /**
   * @internal
   * Creates Storage Key from provided key
   * @param key - Key that gets converted into a Storage Key
   */
  public getStorageKey(key: StorageItemKey): string {
    return this.config.prefix
      ? `_${this.config.prefix}_${key}`
      : key.toString();
  }
}

export type StorageKey = string | number;
export type StorageItemKey = string | number;

/**
 * @param key - Key/Name of Storage
 * @param methods - Storage methods like (get, set, remove)
 */
export interface CreateStorageConfigInterface extends StorageConfigInterface {
  key: string;
  methods: StorageMethodsInterface;
}

/**
 * @param get - Get Method of Storage (gets items from storage)
 * @param set - Set Method of Storage (saves/updates items in storage)
 * @param remove - Remove Methods of Storage (removes items from storage)
 */
export interface StorageMethodsInterface {
  get: (key: string) => any;
  set: (key: string, value: any) => void;
  remove: (key: string) => void;
}

/**
 * @param async - If its an async storage
 * @param prefix - Prefix of Storage Property
 */
export interface StorageConfigInterface {
  async?: boolean;
  prefix?: string;
}
