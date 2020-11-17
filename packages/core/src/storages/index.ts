import {
  Agile,
  Storage,
  isAsyncFunction,
  defineConfig,
  Persistent,
} from "../internal";

export class Storages {
  public agileInstance: () => Agile;

  public storages: { [key: string]: Storage } = {}; // All registered Storages
  public persistentInstances: Set<Persistent> = new Set();

  constructor(agileInstance: Agile, config: StoragesConfigInterface = {}) {
    config = defineConfig(config, {
      localStorage: true,
    });
    this.agileInstance = () => agileInstance;
    if (config.localStorage) this.instantiateLocalStorage();
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
    if (!Storages.localStorageAvailable()) {
      console.warn(
        "Agile: Local Storage is here not available, to use Storage functionalities like persist please provide a custom Storage!"
      );
      return;
    }

    // Create and register Local Storage
    const _localStorage = new Storage({
      key: "localStorage",
      async: false,
      methods: {
        get: localStorage.getItem.bind(localStorage),
        set: localStorage.setItem.bind(localStorage),
        remove: localStorage.removeItem.bind(localStorage),
      },
    });
    this.register(_localStorage);
  }

  public register(storage: Storage): boolean {
    // Check if Storage is async
    if (
      isAsyncFunction(storage.methods.get) ||
      isAsyncFunction(storage.methods.set) ||
      isAsyncFunction(storage.methods.remove)
    )
      storage.config.async = true;

    // Check if Storage already exists
    if (this.storages.hasOwnProperty(storage.key)) {
      console.error(`Agile: Storage `);
      return false;
    }

    // Register Storage
    this.storages[storage.key] = storage;
    storage.ready = true;

    return true;
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

/**
 * @param localStorage - If Local Storage should be instantiated
 */
export interface StoragesConfigInterface {
  localStorage?: boolean;
}
