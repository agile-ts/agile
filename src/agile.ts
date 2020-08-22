import Runtime from "./runtime";
import use, {Integration} from "./integrations/use";
import SubController from "./sub";
import {State} from "./state";
import Storage, {StorageConfigInterface} from "./storage";
import {Collection, Config, DefaultDataItem} from "./collection";
import {Computed} from "./computed";

export interface AgileConfigInterface {
    framework?: any
    logJobs?: boolean
    waitForMount?: boolean,
    storageConfig?: StorageConfigInterface
}

export default class Agile {

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
    // State
    //=========================================================================================================
    /**
     * Create Agile State
     * @param initialState Any - the value to initialize a State instance with
     */
    public State = <ValueType>(initialState: ValueType, key?: string) => new State<ValueType>(this, initialState, key);


    //=========================================================================================================
    // Collection
    //=========================================================================================================
    /**
     * Create Agile Collection
     */
    public Collection = <DataType = DefaultDataItem>(config: Config<DataType>) => new Collection<DataType>(this, config);


    //=========================================================================================================
    // Computed
    //=========================================================================================================
    /**
     * Create a Agile computed function
     * @param deps Array - An array of state items to depend on
     * @param computeFunction Function - A function where the return value is the state, ran every time a dep changes
     */
    public Computed = <T = any>(computeFunction: () => any, deps?: Array<State>) => new Computed<T>(this, computeFunction, deps);


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


