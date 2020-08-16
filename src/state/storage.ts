import Agile from "../agile";
import {State} from "./index";

export interface StorageMethods {
    async?: boolean;
    get?: (key: string) => any;
    set?: (key: string, value: any) => void;
    remove?: (key: string) => void;
}

export default class Storage {
    public agileInstance: Agile;

    public isAsync: boolean = false;
    private storageReady: boolean = false;
    private storageType: 'localStorage' | 'custom' = 'localStorage';
    private storagePrefix: string = 'agile';
    private storageMethods: StorageMethods;

    public persistedStates: Set<State> = new Set();

    constructor(agileInstance: Agile, storageMethods: StorageMethods) {
        this.agileInstance = agileInstance;
        this.storageMethods = storageMethods;

        // Set custom Storage prefix
        if (agileInstance.config.storagePrefix)
            this.storagePrefix = agileInstance.config.storagePrefix;

        // Set custom Storage functions
        if (storageMethods.get || storageMethods.set || storageMethods.remove)
            this.storageType = 'custom';

        // Instantiate Storage
        if (this.storageType === 'custom')
            this.instantiateCustomStorage()
        else
            this.instantiateLocalStorage()

        if (storageMethods.async) this.isAsync = true;
    }


    //=========================================================================================================
    // Instantiate Local Storage
    //=========================================================================================================

    private instantiateLocalStorage() {
        if (this.localStorageAvailable() && this.storagePrefix === 'localStorage') {
            this.storageMethods.get = localStorage.getItem.bind(localStorage);
            this.storageMethods.set = localStorage.setItem.bind(localStorage);
            this.storageMethods.remove = localStorage.removeItem.bind(localStorage);
            this.storageReady = true;
        }
    }


    //=========================================================================================================
    // Instantiate Custom Storage
    //=========================================================================================================

    private instantiateCustomStorage() {
        if (
            this.checkStorageFunction(this.storageMethods.get) &&
            this.checkStorageFunction(this.storageMethods.set) &&
            this.checkStorageFunction(this.storageMethods.remove)
        ) {
            this.storageReady = true;
        } else {
            console.warn("Some of your storage Methods aren't valid!");
        }
    }


    //=========================================================================================================
    // Get
    //=========================================================================================================

    public get(key: string) {
        if (!this.storageReady || !this.storageMethods.get) return;

        // Async get
        if (this.isAsync) {
            return new Promise((resolve, reject) => {
                // @ts-ignore
                this.storageMethods
                    .get(this.getKey(key))
                    .then((res: any) => {
                        // If result is no Json format return it
                        if (typeof res !== 'string') return resolve(res);

                        // Format Json to object
                        resolve(JSON.parse(res));
                    })
                    .catch(reject);
            });
        }

        // Normal get
        try {
            return JSON.parse(this.storageMethods.get(this.getKey(key)));
        } catch (error) {
            console.warn("Agile: Something went wrong by parsing the storage value. Maybe you forgot to set the storage to async")
            return undefined;
        }
    }


    //=========================================================================================================
    // Set
    //=========================================================================================================

    public set(key: string, value: any) {
        if (!this.storageReady || !this.storageMethods.set) return;
        this.storageMethods.set(this.getKey(key), JSON.stringify(value));
    }


    //=========================================================================================================
    // Remove
    //=========================================================================================================

    public remove(key: string) {
        if (!this.storageReady || !this.storageMethods.remove) return;
        this.storageMethods.remove(this.getKey(key));
    }


    //=========================================================================================================
    // Helper
    //=========================================================================================================

    private getKey(key: string) {
        return `_${this.storagePrefix}_${key}`;
    }

    private checkStorageFunction(func: any) {
        return typeof func === 'function';
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
}
