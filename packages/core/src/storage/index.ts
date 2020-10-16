import {
  Agile,
  State,
  Collection,
  isAsyncFunction,
  isFunction,
  isJsonString,
  defineConfig,
} from "../internal";
import { Persistent } from "./persistent";

export class Storage {
  public agileInstance: () => Agile;

  public storageReady: boolean = false;
  public storageType: StorageType = "localStorage";
  public config: StorageConfigInterface;

  public persistentInstances: Set<Persistent> = new Set();

  /**
   * @public
   * Storage
   * @param {Agile} agileInstance - An instance of Agile
   * @param {StorageConfigInterface} storageConfig - Config
   */
  constructor(agileInstance: Agile, storageConfig: StorageConfigInterface) {
    this.agileInstance = () => agileInstance;
    this.config = defineConfig(storageConfig, {
      prefix: "agile",
      async: false,
    });

    // If Storage Methods are provided its a custom Storage
    if (storageConfig.methods) this.storageType = "custom";

    // Instantiate Storage
    if (this.storageType === "custom") this.instantiateCustomStorage();
    if (this.storageType === "localStorage") this.instantiateLocalStorage();
  }

  //=========================================================================================================
  // Instantiate Local Storage
  //=========================================================================================================
  /**
   * @internal
   * Instantiates LocalStorage
   */
  private instantiateLocalStorage() {
    // Check if Local Storage is Available (For instance in ReactNative it doesn't exist)
    if (!Storage.localStorageAvailable()) {
      console.warn(
        "Agile: Local Storage is here not available.. to use the Storage functionality please provide a custom Storage!"
      );
      return;
    }

    // Set StorageMethods to LocalStorageMethods
    this.config.methods = {
      get: localStorage.getItem.bind(localStorage),
      set: localStorage.setItem.bind(localStorage),
      remove: localStorage.removeItem.bind(localStorage),
    };

    this.storageReady = true;
  }

  //=========================================================================================================
  // Instantiate Custom Storage
  //=========================================================================================================
  /**
   * @internal
   * Instantiates Custom Storage
   */
  private instantiateCustomStorage() {
    // Validate Functions
    if (!isFunction(this.config.methods?.get)) {
      console.error("Agile: Your GET StorageMethod isn't valid!");
      return;
    }
    if (!isFunction(this.config.methods?.set)) {
      console.error("Agile: Your SET StorageMethod isn't valid!");
      return;
    }
    if (!isFunction(this.config.methods?.remove)) {
      console.error("Agile: Your REMOVE StorageMethod isn't valid!");
      return;
    }

    // Check if custom Storage is async
    if (
      isAsyncFunction(this.config.methods?.get) ||
      isAsyncFunction(this.config.methods?.set) ||
      isAsyncFunction(this.config.methods?.remove)
    )
      this.config.async = true;

    this.storageReady = true;
  }

  //=========================================================================================================
  // Get
  //=========================================================================================================
  /**
   * @public
   * Gets value at the provided Key
   * @param {StorageKey} key - Key of the Storage property
   */
  public get<GetType = any>(
    key: StorageKey
  ): GetType | Promise<GetType> | undefined {
    if (!this.storageReady || !this.config.methods?.get) return;

    // Async Get
    if (this.config.async) return this.asyncGet<GetType>(key);

    // Normal Get
    const res = this.config.methods.get(this.getStorageKey(key));
    if (isJsonString(res)) return JSON.parse(res);

    return res;
  }

  //=========================================================================================================
  // Async Get
  //=========================================================================================================
  /**
   * @internal
   * Gets value at the provided Key (async)
   * @param {StorageKey} key - Key of the Storage property
   */
  private asyncGet<GetTpe = any>(key: StorageKey): Promise<GetTpe> {
    return new Promise((resolve, reject) => {
      this.config.methods
        ?.get(this.getStorageKey(key))
        .then((res: any) => {
          if (isJsonString(res)) return resolve(JSON.parse(res));
          resolve(res);
        })
        .catch(reject);
    });
  }

  //=========================================================================================================
  // Set
  //=========================================================================================================
  /**
   * @public
   * Saves/Updates value at the provided Key
   * @param {StorageKey} key - Key of the Storage property
   * @param {any} value - Value you want to save
   */
  public set(key: StorageKey, value: any): void {
    if (!this.storageReady || !this.config.methods?.set) return;
    this.config.methods.set(this.getStorageKey(key), JSON.stringify(value));
  }

  //=========================================================================================================
  // Remove
  //=========================================================================================================
  /**
   * @public
   * Removes value at provided Key
   * @param {StorageKey} key - Key of the Storage property
   */
  public remove(key: StorageKey): void {
    if (!this.storageReady || !this.config.methods?.remove) return;
    this.config.methods.remove(this.getStorageKey(key));
  }

  //=========================================================================================================
  // Get Storage Key
  //=========================================================================================================
  /**
   * @internal
   * Create Storage Key out of provide StorageKey
   */
  private getStorageKey(key: StorageKey): string {
    return `_${this.config.prefix}_${key}`;
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
      localStorage.setItem("_myDummyKey_", "myDummyValue");
      localStorage.removeItem("_myDummyKey_");
      return true;
    } catch (e) {
      return false;
    }
  }
}

export type StorageKey = string | number;
export type StorageType = "localStorage" | "custom";
/**
 * @param {boolean} async - If its a async storage
 * @param {string} prefix - Prefix of the storage
 * @param {Object} methods - Storage methods like (get, set, remove)
 * @param {(key: string) => any} methods.get - Get Method which will get Items out of the Storage
 * @param {key: string, value: any) => void} methods.set - Set Method which will set Items into the Storage
 * @param {(key: string) => void} methods.remove - Remove Methods which will remove Items from the Storage
 */
export interface StorageConfigInterface {
  async?: boolean;
  prefix?: string;
  methods?: {
    get: (key: string) => any;
    set: (key: string, value: any) => void;
    remove: (key: string) => void;
  };
}
