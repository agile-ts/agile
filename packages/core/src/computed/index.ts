import {
  State,
  Agile,
  defineConfig,
  Observer,
  StorageKey,
  StatePersistentConfigInterface,
  Event,
  StateConfigInterface,
} from "../internal";

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
      deps: config.deps,
    });
    config = defineConfig(config, {
      computedDeps: [],
    });
    this.agileInstance = () => agileInstance;
    this.computeFunction = computeFunction;

    // Format hardCodedDeps
    for (let dep of config.computedDeps as any) {
      if (dep instanceof Observer) {
        this.hardCodedDeps.push(dep);
        continue;
      }
      if (dep !== undefined && dep["observer"] !== undefined)
        this.hardCodedDeps.push(dep["observer"]);
    }
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
  public recompute(config: RecomputeConfigInterface = {}) {
    config = defineConfig(config, {
      background: false,
      sideEffects: true,
    });
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
    deps: Array<Observer | State | Event> = [],
    config?: RecomputeConfigInterface
  ) {
    this.computeFunction = computeFunction;
    this.hardCodedDeps = deps
      .map((dep) => dep["observer"] || undefined)
      .filter((dep) => dep !== undefined);

    // Recompute for setting initial Computed Function Value and adding missing Dependencies
    this.recompute(config);
  }

  //=========================================================================================================
  // Compute Values
  //=========================================================================================================
  /**
   * @internal
   * Computes Value and adds missing Dependencies to Computed
   */
  public computeValue(): ComputedValueType {
    this.agileInstance().runtime.trackObservers = true;
    const computedValue = this.computeFunction();

    // Get tracked Observers and disable Tracking Observers
    let foundDeps = this.agileInstance().runtime.getTrackedObservers();

    // Handle foundDeps and hardCodedDeps
    const newDeps: Array<Observer> = [];
    this.hardCodedDeps.concat(foundDeps).forEach((observer) => {
      if (!observer) return;
      newDeps.push(observer);

      // Make this Observer depending on Observer -> If value of Observer changes it will ingest this Observer into the Runtime
      observer.depend(this.observer);
    });

    this.deps = newDeps;
    return computedValue;
  }

  //=========================================================================================================
  // Overwriting some functions which aren't allowed to use in Computed
  //=========================================================================================================

  public patch() {
    Agile.logger.error("You can't use patch method on Computed Function!");
    return this;
  }

  public persist(
    keyOrConfig: StorageKey | StatePersistentConfigInterface = {},
    config: StatePersistentConfigInterface = {}
  ): this {
    Agile.logger.error("You can't use persist method on Computed Function!");
    return this;
  }

  public invert(): this {
    Agile.logger.error("You can't use invert method on Computed Function!");
    return this;
  }
}

/**
 * @param computedDeps - Hard coded dependencies of Computed Function
 */
export interface ComputedConfigInterface extends StateConfigInterface {
  computedDeps?: Array<Observer | State | Event>;
}

/**
 * @param background - If recomputing value happens in the background (-> not causing any rerender)
 * @param sideEffects - If Side Effects of Computed get executed
 */
export interface RecomputeConfigInterface {
  background?: boolean;
  sideEffects?: boolean;
}
