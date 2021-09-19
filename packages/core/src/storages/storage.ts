import {
  defineConfig,
  isAsyncFunction,
  isFunction,
  isJsonString,
} from '@agile-ts/utils';
import { LogCodeManager } from '../logCodeManager';

export class Storage {
  public config: StorageConfigInterface;

  // Key/Name identifier of the Storage
  public key: StorageKey;
  // Whether the Storage is ready and is able to store values
  public ready = false;
  // Methods to interact with the external Storage (get, set, remove)
  public methods: StorageMethodsInterface;

  /**
   * A Storage is an interface to an external Storage,
   * and allows the easy interaction with that Storage.
   *
   * Due to the Storage, AgileTs can easily persist its Instances in almost any Storage
   * without a huge overhead.
   *
   * @public
   * @param config - Configuration object
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

  /**
   * Returns a boolean indicating whether the Storage is valid
   * and can be used to persist Instances in it or not.
   *
   * @public
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

  /**
   * Synchronously retrieves the stored value
   * at the specified Storage Item key from the external Storage.
   *
   * When the retrieved value is a JSON-String it is parsed automatically.
   *
   * @public
   * @param key - Key/Name identifier of the value to be retrieved.
   */
  public normalGet<GetTpe = any>(key: StorageItemKey): GetTpe | undefined {
    if (!this.ready || !this.methods.get) return undefined;
    if (isAsyncFunction(this.methods.get)) LogCodeManager.log('13:02:00');

    // Retrieve value
    const res = this.methods.get(this.getStorageKey(key));
    const _res = isJsonString(res) ? JSON.parse(res) : res;

    LogCodeManager.logIfTags(
      ['storage'],
      '13:01:00',
      [this.key, this.getStorageKey(key)],
      _res
    );

    return _res;
  }

  /**
   * Asynchronously retrieves the stored value
   * at the specified Storage Item key from the external Storage.
   *
   * When the retrieved value is a JSON-String it is parsed automatically.
   *
   * @public
   * @param key - Key/Name identifier of the value to be retrieved.
   */
  public get<GetTpe = any>(key: StorageItemKey): Promise<GetTpe | undefined> {
    if (!this.ready || !this.methods.get) return Promise.resolve(undefined);

    // Retrieve value from not promise based Storage
    if (!isAsyncFunction(this.methods.get))
      return Promise.resolve(this.normalGet(key));

    // Retrieve value from promise based Storage
    return new Promise((resolve, reject) => {
      this.methods
        ?.get(this.getStorageKey(key))
        .then((res: any) => {
          const _res = isJsonString(res) ? JSON.parse(res) : res;

          LogCodeManager.logIfTags(
            ['storage'],
            '13:01:00',
            [this.key, this.getStorageKey(key)],
            _res
          );

          resolve(_res);
        })
        .catch(reject);
    });
  }

  /**
   * Stores or updates the value at the specified Storage Item key
   * in the external Storage.
   *
   * @public
   * @param key - Key/Name identifier of the value to be stored or updated.
   * @param value - Value to be stored.
   */
  public set(key: StorageItemKey, value: any): void {
    if (!this.ready || !this.methods.set) return;

    LogCodeManager.logIfTags(['storage'], '13:01:01', [
      this.key,
      this.getStorageKey(key),
    ]);

    this.methods.set(this.getStorageKey(key), JSON.stringify(value));
  }

  /**
   * Removes the value at the specified Storage Item key
   * from the external Storage.
   *
   * @public
   * @param key - Key/Name identifier of the value to be removed.
   */
  public remove(key: StorageItemKey): void {
    if (!this.ready || !this.methods.remove) return;

    LogCodeManager.logIfTags(['storage'], '13:01:02', [
      this.key,
      this.getStorageKey(key),
    ]);

    this.methods.remove(this.getStorageKey(key));
  }

  /**
   * Generates and returns a valid Storage key based on the specified key.
   *
   * @internal
   * @param key - Key to be converted into a valid Storage key.
   */
  public getStorageKey(key: StorageItemKey): string {
    return this.config.prefix
      ? `_${this.config.prefix}_${key}`
      : key.toString();
  }
}

export type StorageKey = string | number;
export type StorageItemKey = string | number;

export interface CreateStorageConfigInterface extends StorageConfigInterface {
  /**
   * Key/Name identifier of the Storage.
   * @default undefined
   */
  key: string;
  /**
   * Storage methods for interacting with the external Storage.
   * @default undefined
   */
  methods: StorageMethodsInterface;
}

export interface StorageMethodsInterface {
  /**
   * Method to retrieve a value at the specified key from the external Storage.
   *
   * @param key - Key/Name identifier of the value to be retrieved.
   */
  get: (key: string) => any;
  /**
   * Method to store or update a value at the specified key in the external Storage.
   *
   * @param key - Key/Name identifier of the value to be stored or updated.
   * @param value - Value to be stored.
   */
  set: (key: string, value: any) => void;
  /**
   * Method to remove a value at the specified key from the external Storage.
   *
   * @param key - Key/Name identifier of the value to be removed.
   */
  remove: (key: string) => void;
}

export interface StorageConfigInterface {
  /**
   * Whether the external Storage represented by the Storage Class works async.
   * @default Automatically detected via the `isAsyncFunction()` method
   */
  async?: boolean;
  /**
   * Prefix to be added before each persisted value key/name identifier.
   * @default 'agile'
   */
  prefix?: string;
}
