import Runtime from "./runtime";
import use, {Integration} from "./use";
import SubController from "./sub";
import {State} from './internal';
import Storage, {StorageConfigInterface} from "./storage";
import Collection, {CollectionConfig, DefaultDataIt../packages/agile-core/src/collectioncollection";
import Computed from "./computed";
import API, {apiConfig} from "../../agile-api/src";
import Event, {EventConfig, DefaultEventPayload} from "./event";

export interface AgileConfigInterface {
    framework?: Integration | any // Integration = for custom frameworks | any = for existing frameworks like react
    logJobs?: boolean // If Agile should log some stuff in the console
    waitForMount?: boolean // If Agile should wait until the component mounted (note working yet)
    storageConfig?: StorageConfigInterface // For custom storage (default: Local Storage)
}

export class Agile {

    public runtime: Runtime;
    public integration: Integration | null = null;
    public subController: SubController;
    public storage: Storage;

    constructor(public config: AgileConfigInterface = {}) {
        this.subController = new SubController(this);
        this.runtime = new Runtime(this);
        this.storage = new Storage(this, config.storageConfig || {});

        // Init Framework
        if (config.framework)
            this.initFrameworkIntegration(config.framework);
        else
            console.warn("Agile: Don't forget to init a framework before using Agile")

        // Creates a global agile instance..
        this.globalBind();
    }


    //=========================================================================================================
    // Init Framework
    //=========================================================================================================
    /**
     * Init a Framework like React or a custom one
     */
    public initFrameworkIntegration(frameworkConstructor: any) {
        use(frameworkConstructor, this);
    }


    //=========================================================================================================
    // API
    //=========================================================================================================
    /**
     * Create Agile API
     * @param config Object
     * @param config.options Object - Typescript default: RequestInit (headers, credentials, mode, etc...)
     * @param config.baseURL String - Url to prepend to endpoints (without trailing slash)
     * @param config.timeout Number - Time to wait for request before throwing error
     */
    public API = (config: apiConfig) => new API(config);


    //=========================================================================================================
    // Storage
    //=========================================================================================================
    /**
     * Create Agile Storage
     */
    public Storage = (config: StorageConfigInterface) => new Storage(this, config);


    //=========================================================================================================
    // State
    //=========================================================================================================
    /**
     * Create Agile State
     * @param initialState Any - the value to initialize a State instance with
     * @key State key/name which identifies the state
     */
    public State = <ValueType>(initialState: ValueType, key?: string) => new State<ValueType>(this, initialState, key);


    //=========================================================================================================
    // Collection
    //=========================================================================================================
    /**
     * Create Agile Collection
     */
    public Collection = <DataType = DefaultDataItem>(config?: CollectionConfig<DataType>) => new Collection<DataType>(this, config);


    //=========================================================================================================
    // Computed
    //=========================================================================================================
    /**
     * Create a Agile computed function
     * @param deps Array - An array of state items to depend on
     * @param computeFunction Function - A function where the return value is the state, ran every time a dep changes
     */
    public Computed = <ComputedValueType = any>(computeFunction: () => ComputedValueType, deps?: Array<State>) => new Computed<ComputedValueType>(this, computeFunction, deps);


    //=========================================================================================================
    // Event
    //=========================================================================================================
    /**
     * Create a Pulse Event
     */
    public Event = <PayloadType = DefaultEventPayload>(config?: EventConfig) => new Event<PayloadType>(this, config);


    //=========================================================================================================
    // Set Storage
    //=========================================================================================================
    /**
     * Configures the Agile Storage
     * @param storageConfig
     */
    public setStorage(storageConfig: StorageConfigInterface): void {
        // Get States which are already saved into a storage
        const persistedStates = this.storage.persistedStates;

        // Define new Storage
        this.storage = new Storage(this, storageConfig);
        this.storage.persistedStates = persistedStates;

        // Save all already saved states into the new Storage
        this.storage.persistedStates.forEach(state => state.persist(state.key));

        // Save all already saved collections into the new Storage
        this.storage.persistedCollections.forEach(collection => collection.persist(collection.key));
    }


    //=========================================================================================================
    // Global Bind
    //=========================================================================================================
    /**
     * @internal
     * Creates a global reference to the first pulse instance created this runtime
     */
    private globalBind() {
        try {
            // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/globalThis
            // @ts-ignore
            if (!globalThis.__agile) globalThis.__agile = this;
        } catch (error) {
            // fail silently
        }
    }
}


