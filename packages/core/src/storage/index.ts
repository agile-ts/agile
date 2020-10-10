import {
  Agile,
  State,
  Collection,
  isAsyncFunction,
  isFunction,
  isJsonString,
} from "../internal";

export type StorageKey = string | number;
/**
 * Configure AgileStorage
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

export class Storage {
  public agileInstance: () => Agile;

  public isAsync: boolean = false;
  private storageReady: boolean = false;
  private storageType: "localStorage" | "custom" = "localStorage";
  private storagePrefix: string = "agile";
  private storageConfig: StorageConfigInterface;

  public persistedItems: Set<State> = new Set();
  public persistedCollections: Set<Collection> = new Set();

  constructor(agileInstance: Agile, storageConfig: StorageConfigInterface) {
    this.agileInstance = () => agileInstance;
    this.storageConfig = storageConfig;

    // Set custom Storage prefix
    if (storageConfig.prefix) this.storagePrefix = storageConfig.prefix;

    // Set custom Storage functions
    if (storageConfig.methods) this.storageType = "custom";

    if (storageConfig.async) this.isAsync = true;

    // Instantiate Custom Storage
    if (this.storageType === "custom") this.instantiateCustomStorage();

    // Instantiate Local Storage
    if (this.storageType === "localStorage") this.instantiateLocalStorage();
  }

  //=========================================================================================================
  // Instantiate Local Storage
  //=========================================================================================================
  /**
   * This instantiate the Local Storage
   */
  private instantiateLocalStorage() {
    // Check if Local Storage is Available (For instance in ReactNative it doesn't exist)
    if (!this.localStorageAvailable()) {
      console.warn(
        "Agile: Local Storage is here not available.. to use the Storage functionality please provide a custom Storage!"
      );
      return;
    }

    // Set StorageMethods to LocalStorageMethods
    this.storageConfig.methods = {
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
   * This instantiate the Custom Storage
   */
  private instantiateCustomStorage() {
    // Check Get Function
    if (!isFunction(this.storageConfig.methods?.get)) {
      console.error("Agile: Your GET StorageMethod isn't valid!");
      return;
    }

    // Check Set Function
    if (!isFunction(this.storageConfig.methods?.set)) {
      console.error("Agile: Your SET StorageMethod isn't valid!");
      return;
    }

    // Check Remove Function
    if (!isFunction(this.storageConfig.methods?.remove)) {
      console.error("Agile: Your REMOVE StorageMethod isn't valid!");
      return;
    }

    // Check if one function is async if so set is Async to true
    if (
      isAsyncFunction(this.storageConfig.methods?.get) ||
      isAsyncFunction(this.storageConfig.methods?.set) ||
      isAsyncFunction(this.storageConfig.methods?.remove)
    )
      this.isAsync = true;

    this.storageReady = true;
  }

  //=========================================================================================================
  // Get
  //=========================================================================================================
  /**
   * Gets the value provided by the key from the storage
   */
  public get<GetType = any>(
    key: StorageKey
  ): GetType | Promise<GetType> | undefined {
    if (!this.storageReady || !this.storageConfig.methods?.get) return;

    // Async Get
    if (this.isAsync)
      return new Promise((resolve, reject) => {
        this.storageConfig.methods
          ?.get(this.getStorageKey(key))
          .then((res: any) => {
            // If result is no Json
            if (!isJsonString(res)) return resolve(res);

            // Format Json to Object
            resolve(JSON.parse(res));
          })
          .catch(reject);
      });

    // Normal Get
    const res = this.storageConfig.methods.get(this.getStorageKey(key));
    if (isJsonString(res)) return JSON.parse(res);

    return res;
  }

  //=========================================================================================================
  // Set
  //=========================================================================================================
  /**
   * Sets the value into the storage
   */
  public set(key: StorageKey, value: any) {
    if (!this.storageReady || !this.storageConfig.methods?.set) return;
    this.storageConfig.methods.set(
      this.getStorageKey(key),
      JSON.stringify(value)
    );
  }

  //=========================================================================================================
  // Remove
  //=========================================================================================================
  /**
   * Deletes the value that is stored with the key
   */
  public remove(key: StorageKey) {
    if (!this.storageReady || !this.storageConfig.methods?.remove) return;
    this.storageConfig.methods.remove(this.getStorageKey(key));
  }

  //=========================================================================================================
  // Helper
  //=========================================================================================================

  private getStorageKey(key: StorageKey) {
    return `_${this.storagePrefix}_${key}`;
  }

  private localStorageAvailable() {
    try {
      localStorage.setItem("_", "_");
      localStorage.removeItem("_");
      return true;
    } catch (e) {
      return false;
    }
  }
}
