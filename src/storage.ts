import Agile from "./agile";
import {State} from "./state";
import {isAsyncFunction, isFunction} from "./utils";

export interface StorageConfigInterface {
    async?: boolean
    prefix?: string
    methods?: {
        get: (key: string) => any
        set: (key: string, value: any) => void
        remove: (key: string) => void
    }
}

export default class Storage {
    public agileInstance: Agile;

    public isAsync: boolean = false;
    private storageReady: boolean = false;
    private storageType: 'localStorage' | 'custom' = 'localStorage';
    private storagePrefix: string = 'agile';
    private storageConfig: StorageConfigInterface;

    public persistedStates: Set<State> = new Set();

    constructor(agileInstance: Agile, storageConfig: StorageConfigInterface) {
        this.agileInstance = agileInstance;
        this.storageConfig = storageConfig;

        // Set custom Storage prefix
        if (storageConfig.prefix)
            this.storagePrefix = storageConfig.prefix;

        // Set custom Storage functions
        if (storageConfig.methods)
            this.storageType = 'custom';

        if (storageConfig.async)
            this.isAsync = true;

        // Instantiate Custom Storage
        if (this.storageType === 'custom')
            this.instantiateCustomStorage()

        // Instantiate Local Storage
        if (this.storageType === 'localStorage')
            this.instantiateLocalStorage()
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
            console.warn("Agile: Local Storage is here not available.. to use the Storage functionality please provide a custom Storage!");
            return;
        }

        // Set StorageMethods to LocalStorageMethods
        this.storageConfig.methods = {
            get: localStorage.getItem.bind(localStorage),
            set: localStorage.setItem.bind(localStorage),
            remove: localStorage.removeItem.bind(localStorage)
        }
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
        // @ts-ignore
        if (!isFunction(this.storageConfig.methods?.get)) {
            console.error("Agile: Your GET StorageMethod isn't valid!");
            return;
        }

        // Check Set Function
        // @ts-ignore
        if (!isFunction(this.storageConfig.methods?.set)) {
            console.error("Agile: Your SET StorageMethod isn't valid!");
            return;
        }

        // Check Remove Function
        // @ts-ignore
        if (!isFunction(this.storageConfig.methods?.remove)) {
            console.error("Agile: Your REMOVE StorageMethod isn't valid!");
            return;
        }

        // Check if one function is async if so set is Async to true
        // @ts-ignore
        if (isAsyncFunction(this.storageConfig.methods?.get) || isAsyncFunction(this.storageConfig.methods?.set) || isAsyncFunction(this.storageConfig.methods?.remove))
            this.isAsync = true;

        this.storageReady = true;
    }


    //=========================================================================================================
    // Get
    //=========================================================================================================
    /**
     * Gets the value provided by the key from the storage
     */
    public get<GetType = any>(key: string): GetType | Promise<GetType> | undefined {
        if (!this.storageReady || !this.storageConfig.methods?.get) return;

        // Async Get
        if (this.isAsync)
            return new Promise((resolve, reject) => {
                this.storageConfig.methods?.get(this.getStorageKey(key))
                    .then((res: any) => {
                        // If result is no Json
                        if (!this.isJsonString(res))
                            return resolve(res);

                        // Format Json to Object
                        resolve(JSON.parse(res));
                    })
                    .catch(reject);
            });

        // Normal Get
        if (this.isJsonString(this.storageConfig.methods.get(this.getStorageKey(key))))
            return JSON.parse(this.storageConfig.methods.get(this.getStorageKey(key)));

        // If the JsonString is not valid it might be a promise
        console.warn("Agile: Something went wrong by parsing the storage value into json. Maybe you forgot to set the storage to async");
        return undefined;
    }


    //=========================================================================================================
    // Set
    //=========================================================================================================
    /**
     * Sets the value into the storage
     */
    public set(key: string, value: any) {
        if (!this.storageReady || !this.storageConfig.methods?.set) return;
        this.storageConfig.methods.set(this.getStorageKey(key), JSON.stringify(value));
    }


    //=========================================================================================================
    // Remove
    //=========================================================================================================
    /**
     * Deletes the value that is stored with the key
     */
    public remove(key: string) {
        if (!this.storageReady || !this.storageConfig.methods?.remove) return;
        this.storageConfig.methods.remove(this.getStorageKey(key));
    }


    //=========================================================================================================
    // Helper
    //=========================================================================================================

    private getStorageKey(key: string) {
        return `_${this.storagePrefix}_${key}`;
    }

    private localStorageAvailable() {
        try {
            localStorage.setItem('_', '_');
            localStorage.removeItem('_');
            return true;
        } catch (e) {
            return false;
        }
    }

    private isJsonString(value: any) {
        try {
            JSON.parse(value);
        } catch (e) {
            return false;
        }
        return true;
    }
}
