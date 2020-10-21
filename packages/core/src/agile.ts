import {
  Runtime,
  Integration,
  State,
  Storage,
  StorageConfigInterface,
  Collection,
  CollectionConfig,
  DefaultDataItem,
  Computed,
  Event,
  EventConfig,
  DefaultEventPayload,
  Integrations,
  Observer,
  SubController,
} from "./internal";

export class Agile {
  public runtime: Runtime; // Handles Jobs that have to be 'rerendered'
  public subController: SubController; // Handles subscriptions to Components
  public storage: Storage; // Handles permanent saving

  // Integrations
  public integrations: Integrations; // Integrated frameworks
  static initialIntegrations: Integration[] = []; // Had to create this, to add integrations to Agile without creating a new Instance of it

  /**
   * @public
   * Agile - Global state and logic framework for reactive Typescript & Javascript applications
   * @param config - Config
   */
  constructor(public config: AgileConfigInterface = {}) {
    this.integrations = new Integrations(this);
    this.runtime = new Runtime(this);
    this.subController = new SubController(this);
    this.storage = new Storage(this, config.storageConfig || {});

    // Create global agileInstance
    this.globalBind();
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
   * Creates custom Storage
   * @param config - Config
   */
  public Storage = (config: StorageConfigInterface) =>
    new Storage(this, config);

  //=========================================================================================================
  // State
  //=========================================================================================================
  /**
   * @public
   * State - Handles one value and causes rerender on subscribed Components
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
   * Collection - Handles a List of Objects with a key and causes rerender on subscribed Components
   * @param config - Config
   */
  public Collection = <DataType = DefaultDataItem>(
    config?: CollectionConfig<DataType>
  ) => new Collection<DataType>(this, config);

  //=========================================================================================================
  // Computed
  //=========================================================================================================
  /**
   * @public
   * Computed - Function that recomputes its value if a dependency changes
   * @param computeFunction - Computed Function
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
   * Handy function for emitting UI updates and passing data with them
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

  //=========================================================================================================
  // Global Bind
  //=========================================================================================================
  /**
   * @internal
   * Creates a global reference to the first agileInstance
   * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/globalThis
   */
  private globalBind() {
    try {
      if (!globalThis.__agile) globalThis.__agile = this;
    } catch (error) {
      console.warn("Agile: Failed to create global agileInstance");
    }
  }
}

/**
 * @param logJobs - Allow Agile Logs
 * @param waitForMount - If Agile should wait until the component mounts
 * @param storageConfig - For setting up custom Storage
 */
export interface AgileConfigInterface {
  logJobs?: boolean;
  waitForMount?: boolean;
  storageConfig?: StorageConfigInterface;
}
