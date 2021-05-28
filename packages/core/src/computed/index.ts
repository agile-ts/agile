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
  LogCodeManager,
} from '../internal';

export class Computed<ComputedValueType = any> extends State<
  ComputedValueType
> {
  public agileInstance: () => Agile;

  public computeFunction: () => ComputedValueType; // Function to compute the computed value
  public deps: Array<Observer> = []; // All dependencies the Computed depends on (including hardCoded and autoDetected dependencies)
  public hardCodedDeps: Array<Observer> = []; // Only hardCoded dependencies the Computed depends

  /**
   * A extension of the State Class that computes its value based on a compute function.
   *
   * The computed value will be cached to avoid unnecessary recomputes
   * and only recomputed when one of its direct dependencies changed.
   *
   * Direct dependencies can be States and Collections.
   * Meaning if a dependent State value changes, the computed value will be recomputed.
   *
   * [Learn more..](https://agile-ts.org/docs/core/computed/)
   *
   * @public
   * @param agileInstance - Instance of Agile the Computed belongs to.
   * @param computeFunction - Function to compute the computed value.
   * @param config - Configuration object
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

    // Extract Observer of passed hardcoded dependency instances
    this.hardCodedDeps = extractObservers(config.computedDeps).filter(
      (dep): dep is Observer => dep !== undefined
    );
    this.deps = this.hardCodedDeps;

    // Initial recompute to assign initial value and autodetect missing dependencies
    this.recompute({ autodetect: true });
  }

  /**
   * Forces a recomputation of the cached value based on the compute function.
   *
   * [Learn more..](https://agile-ts.org/docs/core/computed/methods/#recompute)
   *
   * @public
   * @param config - Configuration object
   */
  public recompute(config: RecomputeConfigInterface = {}): this {
    config = defineConfig(config, {
      autodetect: false,
    });
    this.observer.ingestValue(
      this.compute({ autodetect: config.autodetect }),
      removeProperties(config, ['autodetect'])
    );
    return this;
  }

  /**
   * Assigns new function to the Computed to compute the computed value.
   *
   * The dependencies of the new compute function are automatically detected
   * and accordingly updated in the Computed Class.
   *
   * A initial computation is automatically performed with the new function
   * to update the outdated cached value of the Computed.
   *
   * [Learn more..](https://agile-ts.org/docs/core/computed/methods/#updatecomputefunction)
   *
   * @public
   * @param computeFunction - New function to compute the computed value.
   * @param deps - Hard coded dependencies on which the Computed Class depends.
   * @param config - Configuration object
   */
  public updateComputeFunction(
    computeFunction: () => ComputedValueType,
    deps: Array<SubscribableAgileInstancesType> = [],
    config: UpdateComputeFunctionConfigInterface = {}
  ): this {
    config = defineConfig(config, {
      overwriteDeps: true,
      autodetect: true,
    });

    // Update dependencies of Computed
    const newDeps = extractObservers(deps).filter(
      (dep): dep is Observer => dep !== undefined
    );
    if (config.overwriteDeps) this.hardCodedDeps = newDeps;
    else this.hardCodedDeps = this.hardCodedDeps.concat(newDeps);
    this.deps = this.hardCodedDeps;

    // Update computeFunction
    this.computeFunction = computeFunction;

    // Recompute to assign new computed value and autodetect missing dependencies
    this.recompute(removeProperties(config, ['overwriteDeps']));

    return this;
  }

  /**
   * Computes the value of the Computed Class and autodetects used dependencies in the compute function.
   *
   * @internal
   * @param config - Configuration object
   */
  public compute(config: ComputeConfigInterface = {}): ComputedValueType {
    config = defineConfig(config, {
      autodetect: true,
    });

    // Start auto tracking of Observers on which the computeFunction might depend
    if (config.autodetect) ComputedTracker.track();

    const computedValue = this.computeFunction();

    // Handle auto tracked Observers
    if (config.autodetect) {
      const foundDeps = ComputedTracker.getTrackedObservers();
      const newDeps: Array<Observer> = [];
      this.hardCodedDeps.concat(foundDeps).forEach((observer) => {
        newDeps.push(observer);

        // Make this Observer depend on the foundDep Observer
        observer.depend(this.observer);
      });

      this.deps = newDeps;
    }

    return computedValue;
  }

  /**
   * Not usable in Computed Class.
   */
  public patch() {
    LogCodeManager.log('19:03:00');
    return this;
  }

  /**
   * Not usable in Computed Class.
   */
  public persist(): this {
    LogCodeManager.log('19:03:01');
    return this;
  }

  /**
   * Not usable in Computed Class.
   */
  public invert(): this {
    LogCodeManager.log('19:03:02');
    return this;
  }
}

/**
 * @param computedDeps - Hard coded dependencies of compute function
 */
export interface ComputedConfigInterface extends StateConfigInterface {
  computedDeps?: Array<SubscribableAgileInstancesType>;
}

/**
 * @param autodetect - If dependencies get autodetected
 */
export interface ComputeConfigInterface {
  autodetect?: boolean;
}

/**
 * @param overwriteDeps - If old hardCoded deps get overwritten
 */
export interface UpdateComputeFunctionConfigInterface
  extends RecomputeConfigInterface {
  overwriteDeps?: boolean;
}

export interface RecomputeConfigInterface
  extends StateIngestConfigInterface,
    ComputeConfigInterface {}

type SubscribableAgileInstancesType = State | Collection | Observer;
