import {
  Runtime,
  Integration,
  State,
  Storage,
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
  Storages,
  CreateStorageConfigInterface,
  RegisterConfigInterface,
  defineConfig,
  Logger,
} from "./internal";

export class Agile {
  public config: AgileConfigInterface;

  public runtime: Runtime;
  public subController: SubController; // Handles subscriptions to Components
  public storages: Storages; // Handles permanent saving

  // Integrations
  public integrations: Integrations; // Integrated frameworks
  static initialIntegrations: Integration[] = []; // External added Integrations

  static logger = new Logger();

  /**
   * @public
   * Agile - Global state and logic framework for reactive Typescript & Javascript applications
   * @param config - Config
   */
  constructor(config: AgileConfigInterface = {}) {
    this.config = defineConfig(config, {
      localStorage: true,
      logJobs: false,
      waitForMount: false,
    });
    this.integrations = new Integrations(this);
    this.runtime = new Runtime(this);
    this.subController = new SubController(this);
    this.storages = new Storages(this, {
      localStorage: this.config.localStorage,
    });
    Agile.logger = new Logger({
      prefix: "Agile",
      active: true,
      level: 0,
      canUseCustomStyles: true,
      allowedTags: ["runtime", "storage", "subscription", "multieditor"],
    });

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
  public Storage = (config: CreateStorageConfigInterface) =>
    new Storage(config);

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
  // Register Storage
  //=========================================================================================================
  /**
   * @public
   * Registers new Storage as Agile Storage
   * @param storage - new Storage
   * @param config - Config
   */
  public registerStorage(
    storage: Storage,
    config: RegisterConfigInterface = {}
  ): boolean {
    return this.storages.register(storage, config);
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
  localStorage?: boolean;
}
