import {
  State,
  Agile,
  defineConfig,
  Observer,
  StateConfigInterface,
  ComputedTracker,
  Collection,
  extractObservers,
  StateIngestConfigInterface,
  removeProperties,
} from '../internal';

export class Computed<ComputedValueType = any> extends State<
  ComputedValueType
> {
  public agileInstance: () => Agile;

  public computeFunction: () => ComputedValueType;
  public deps: Array<Observer> = []; // All Dependencies of Computed (hardCoded and autoDetected)
  public hardCodedDeps: Array<Observer> = []; // HardCoded Dependencies of Computed

  /**
   * @public
   * Computed - Function that recomputes its value if a dependency changes
   * @param agileInstance - An instance of Agile
   * @param computeFunction - Function for computing value
   * @param config - Config
   */
  constructor(
    agileInstance: Agile,
    computeFunction: () => ComputedValueType,
    config: ComputedConfigInterface = {}
  ) {
    super(agileInstance, computeFunction(), {
      key: config.key,
      dependents: config.dependents,
    });
    config = defineConfig(config, {
      computedDeps: [],
    });
    this.agileInstance = () => agileInstance;
    this.computeFunction = computeFunction;

    // Format hardCodedDeps
    this.hardCodedDeps = extractObservers(config.computedDeps).filter(
      (dep): dep is Observer => dep !== undefined
    );
    this.deps = this.hardCodedDeps;

    // Recompute for setting initial value and adding missing dependencies
    this.recompute();
  }

  //=========================================================================================================
  // Recompute
  //=========================================================================================================
  /**
   * @public
   * Recomputes Value of Computed
   * @param config - Config
   */
  public recompute(config: StateIngestConfigInterface = {}) {
    this.ingest(config);
  }

  //=========================================================================================================
  // Updates Compute Function
  //=========================================================================================================
  /**
   * @public
   * Applies new compute Function to Computed
   * @param computeFunction - New Function for computing value
   * @param deps - Hard coded dependencies of Computed Function
   * @param config - Config
   */
  public updateComputeFunction(
    computeFunction: () => ComputedValueType,
    deps: Array<SubscribableAgileInstancesType> = [],
    config: UpdateComputeFunctionInterface = {}
  ) {
    config = defineConfig(config, {
      overwriteDeps: true,
    });

    // Update deps
    const newDeps = extractObservers(deps).filter(
      (dep): dep is Observer => dep !== undefined
    );
    if (config.overwriteDeps) this.hardCodedDeps = newDeps;
    else this.hardCodedDeps = this.hardCodedDeps.concat(newDeps);
    this.deps = this.hardCodedDeps;

    // Update computeFunction
    this.computeFunction = computeFunction;

    // Recompute for setting initial Computed Function Value and adding missing Dependencies
    this.recompute(removeProperties(config, ['overwriteDeps']));
  }

  //=========================================================================================================
  // Compute
  //=========================================================================================================
  /**
   * @internal
   * Recomputes value and adds missing dependencies to Computed
   */
  public compute(): ComputedValueType {
    // Auto track Observers the computeFunction might depend on
    ComputedTracker.track();
    const computedValue = this.computeFunction();
    const foundDeps = ComputedTracker.getTrackedObservers();

    // Handle foundDeps and hardCodedDeps
    const newDeps: Array<Observer> = [];
    this.hardCodedDeps.concat(foundDeps).forEach((observer) => {
      newDeps.push(observer);

      // Make this Observer depending on foundDep Observer
      observer.depend(this.observer);
    });

    this.deps = newDeps;
    return computedValue;
  }

  //=========================================================================================================
  // Overwriting some functions which aren't allowed to use in Computed
  //=========================================================================================================

  public patch() {
    Agile.logger.error("You can't use patch method on ComputedState!");
    return this;
  }

  public persist(): this {
    Agile.logger.error("You can't use persist method on ComputedState!");
    return this;
  }

  public invert(): this {
    Agile.logger.error("You can't use invert method on ComputedState!");
    return this;
  }
}

/**
 * @param computedDeps - Hard coded dependencies of Computed Function
 */
export interface ComputedConfigInterface extends StateConfigInterface {
  computedDeps?: Array<SubscribableAgileInstancesType>;
}

/**
 * @param overwriteDeps - If old hardCoded deps get overwritten
 */
export interface UpdateComputeFunctionInterface
  extends StateIngestConfigInterface {
  overwriteDeps?: boolean;
}

type SubscribableAgileInstancesType = State | Collection | Observer;
