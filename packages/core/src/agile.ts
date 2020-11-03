import {
  Runtime,
  Integration,
  State,
  Storage,
  StorageConfigInterface,
  Collection,
  CollectionConfig,
  DefaultItem,
  Computed,
  Event,
  EventConfig,
  DefaultEventPayload,
  Integrations,
  Observer,
  SubController,
  globalBind,
} from "./internal";

export class Agile {
  public runtime: Runtime;
  public subController: SubController; // Handles subscriptions to Components
  public storage: Storage; // Handles permanent saving

  // Integrations
  public integrations: Integrations; // Integrated frameworks
  static initialIntegrations: Integration[] = []; // External added Integrations

  /**
   * @public
   * Agile - Global state and logic framework for reactive Typescript & Javascript applications
   * @param config - Config
   */
  constructor(public config: AgileConfigInterface = {}) {
    this.integrations = new Integrations(this);
    this.runtime = new Runtime(this);
    this.subController = new SubController(this);
    this.storage = new Storage(config.storageConfig || {});

    // Create global instance of Agile
    globalBind("__agile__", this);
  }

  //=========================================================================================================
  // Use
  //=========================================================================================================
  /**
   * @public
   * Integrates framework into Agile
   * @param integration - Integration that gets registered/integrated
   */
  public use(integration: Integration) {
    this.integrations.integrate(integration);
    return this;
  }

  //=========================================================================================================
  // Storage
  //=========================================================================================================
  /**
   * @public
   * Storage - Handy Interface for storing Items permanently
   * @param config - Config
   */
  public Storage = (config: StorageConfigInterface) => new Storage(config);

  //=========================================================================================================
  // State
  //=========================================================================================================
  /**
   * @public
   * State - Class that holds one Value and causes rerender on subscribed Components
   * @param initialValue - Initial Value of the State
   * @param key - Key/Name of the State
   */
  public State = <ValueType>(initialValue: ValueType, key?: string) =>
    new State<ValueType>(this, initialValue, key);

  //=========================================================================================================
  // Collection
  //=========================================================================================================
  /**
   * @public
   * Collection - Class that holds a List of Objects with key and causes rerender on subscribed Components
   * @param config - Config
   */
  public Collection = <DataType = DefaultItem>(
    config?: CollectionConfig<DataType>
  ) => new Collection<DataType>(this, config);

  //=========================================================================================================
  // Computed
  //=========================================================================================================
  /**
   * @public
   * Computed - Function that recomputes its value if a dependency changes
   * @param computeFunction - Function for computing value
   * @param deps - Hard coded dependencies of Computed Function
   */
  public Computed = <ComputedValueType = any>(
    computeFunction: () => ComputedValueType,
    deps?: Array<Observer | State | Event>
    // @ts-ignore
  ) => new Computed<ComputedValueType>(this, computeFunction, deps);

  //=========================================================================================================
  // Event
  //=========================================================================================================
  /**
   * @public
   * Event - Class that holds a List of Functions which can be triggered at the same time
   * @param config - Config
   */
  public Event = <PayloadType = DefaultEventPayload>(config?: EventConfig) =>
    new Event<PayloadType>(this, config);

  //=========================================================================================================
  // Set Storage
  //=========================================================================================================
  /**
   * @public
   * Configures Agile Storage
   * @param storage - Storage that will get used as Agile Storage
   */
  public configureStorage(storage: Storage): void {
    // Get Observers that are already saved into a storage
    const persistentInstances = this.storage.persistentInstances;

    // Define new Storage
    this.storage = storage;

    // Transfer already saved items into new Storage
    persistentInstances.forEach((persistent) =>
      persistent.initialLoading(persistent.key)
    );
  }

  //=========================================================================================================
  // Has Integration
  //=========================================================================================================
  /**
   * @public
   * Checks if Agile has any registered Integration
   */
  public hasIntegration(): boolean {
    return this.integrations.hasIntegration();
  }
}

/**
 * @param logJobs - Allow Agile Logs
 * @param waitForMount - If Agile should wait until the component mounts
 * @param storageConfig - To configure Agile Storage
 */
export interface AgileConfigInterface {
  logJobs?: boolean;
  waitForMount?: boolean;
  storageConfig?: StorageConfigInterface;
}
