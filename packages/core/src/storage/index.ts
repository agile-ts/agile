import {
  isAsyncFunction,
  isFunction,
  isJsonString,
  defineConfig,
  Persistent,
} from "../internal";

export class Storage {
  public storageReady: boolean = false;
  public storageType: StorageType = "localStorage";
  public config: StorageConfigInterface;

  public persistentInstances: Set<Persistent> = new Set();

  /**
   * @public
   * Storage - Interface for storing Items permanently
   * @param storageConfig - Config
   */
  constructor(storageConfig: StorageConfigInterface) {
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
   * Instantiates Local Storage
   */
  private instantiateLocalStorage() {
    // Check if Local Storage is Available
    if (!Storage.localStorageAvailable()) {
      console.warn(
        "Agile: Local Storage is here not available, to use Storage functionalities like persist please provide a custom Storage!"
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
   * Gets value at provided Key
   * @param key - Key of Storage property
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
   * Gets value at provided Key (async)
   * @param key - Key of Storage property
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
   * Saves/Updates value at provided Key
   * @param key - Key of Storage property
   * @param value - new Value that gets set
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
   * @param key - Key of Storage property
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
   * Creates Storage Key from provided key
   * @param key - Key that gets converted into a Storage Key
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
 * @param async - If its an async storage
 * @param prefix - Prefix of Storage Property
 * @param methods - Storage methods like (get, set, remove)
 * @param methods.get - Get Method of Storage (gets items from storage)
 * @param methods.set - Set Method of Storage (saves/updates items in storage)
 * @param methods.remove - Remove Methods of Storage (removes items from storage)
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
