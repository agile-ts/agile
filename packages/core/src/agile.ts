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
} from "./internal";

/**
 * @param {boolean} logJobs - Allow Agile Logs
 * @param {boolean} waitForMount - If Agile should wait until the component mounts
 * @param {StorageConfigInterface} storageConfig - For setting up custom Storage
 */
export interface AgileConfigInterface {
  logJobs?: boolean;
  waitForMount?: boolean;
  storageConfig?: StorageConfigInterface;
}

export class Agile {
  public runtime: Runtime;
  public storage: Storage;

  // Integrations
  public integrations: Integrations; // Integrated frameworks
  static initialIntegrations: Integration[] = []; // Had to create this, to add integrations to Agile without creating a new Instance of it

  /**
   * @public
   * Agile
   * @param {AgileConfigInterface} config - Config
   */
  constructor(public config: AgileConfigInterface = {}) {
    this.integrations = new Integrations(this);
    this.runtime = new Runtime(this);
    this.storage = new Storage(this, config.storageConfig || {});

    // Bind Frameworks to Agile
    this.integrations.bind();

    // Creates a global agileInstance
    this.globalBind();
  }

  //=========================================================================================================
  // Use
  //=========================================================================================================
  /**
   * @public
   * Integrate framework into Agile
   * @param {Integration} integration - Integration which you want to integrate/register
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
   * Create custom Storage
   * @param {StorageConfigInterface} config - Config
   */
  public Storage = (config: StorageConfigInterface) =>
    new Storage(this, config);

  //=========================================================================================================
  // State
  //=========================================================================================================
  /**
   * @public
   * Create Agile State
   * @param {ValueType} initialValue - Initial value of the State
   * @param {string} key - Key/Name of the State
   */
  public State = <ValueType>(initialValue: ValueType, key?: string) =>
    new State<ValueType>(this, initialValue, key);

  //=========================================================================================================
  // Collection
  //=========================================================================================================
  /**
   * @public
   * Create Agile Collection, which olds an List of Objects
   * @param {CollectionConfig} config - Config
   */
  public Collection = <DataType = DefaultDataItem>(
    config?: CollectionConfig<DataType>
  ) => new Collection<DataType>(this, config);

  //=========================================================================================================
  // Computed
  //=========================================================================================================
  /**
   * @public
   * Create Agile Computed Function, which will be updated if any dependency get updated
   * @param {() => ComputedValueType} computeFunction - Computed Function
   * @param {Array<State>} deps - Deps of the Computed Function
   */
  public Computed = <ComputedValueType = any>(
    computeFunction: () => ComputedValueType,
    deps?: Array<State | Observer>
  ) =>
    new Computed<ComputedValueType>(
      this,
      computeFunction,
      deps?.map((dep) => (dep instanceof State ? dep.observer : dep))
    );

  //=========================================================================================================
  // Event
  //=========================================================================================================
  /**
   * @public
   * Create Agile Event
   * @param {EventConfig} config - Config
   */
  public Event = <PayloadType = DefaultEventPayload>(config?: EventConfig) =>
    new Event<PayloadType>(this, config);

  //=========================================================================================================
  // Set Storage
  //=========================================================================================================
  /**
   * @public
   * Configure AgileStorage
   * @param {StorageConfigInterface} config - Config
   */
  public configureStorage(config: StorageConfigInterface): void {
    // Get States which are already saved into a storage
    const persistedItems = this.storage.persistedStates;

    // Define new Storage
    this.storage = new Storage(this, config);
    this.storage.persistedStates = persistedItems;

    // Transfer already saved items to the new Storage
    this.storage.persistedStates.forEach((state) => state.persist(state.key));
    this.storage.persistedCollections.forEach((collection) =>
      collection.persist(collection.key)
    );
  }

  //=========================================================================================================
  // Has Integration
  //=========================================================================================================
  /**
   * @public
   * Checks if Agile has registered any Integration
   */
  public hasIntegration(): boolean {
    return this.integrations.hasIntegration();
  }

  //=========================================================================================================
  // Global Bind
  //=========================================================================================================
  /**
   * @internal
   * Creates a global reference to the first agileInstance created
   * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/globalThis
   */
  private globalBind() {
    try {
      if (!globalThis.__agile) globalThis.__agile = this;
    } catch (error) {
      console.warn("Failed to create global agileInstance");
    }
  }
}
