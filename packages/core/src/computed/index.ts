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
  isAsyncFunction,
} from '../internal';

export class Computed<ComputedValueType = any> extends State<
  ComputedValueType
> {
  public config: ComputedConfigInterface;

  // Function to compute the Computed Class value
  public computeFunction: ComputeFunctionType<ComputedValueType>;
  // All dependencies the Computed Class depends on (including hardCoded and automatically detected dependencies)
  public deps: Set<Observer> = new Set();
  // Only hardCoded dependencies the Computed Class depends on
  public hardCodedDeps: Array<Observer> = [];

  /**
   * A Computed is an extension of the State Class
   * that computes its value based on a specified compute function.
   *
   * The computed value will be cached to avoid unnecessary recomputes
   * and is only recomputed when one of its direct dependencies changes.
   *
   * Direct dependencies can be States and Collections.
   * So when, for example, a dependent State value changes, the computed value is recomputed.
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
    computeFunction: ComputeFunctionType<ComputedValueType>,
    config: CreateComputedConfigInterface = {}
  ) {
    super(agileInstance, null as any, {
      key: config.key,
      dependents: config.dependents,
    });
    config = defineConfig(config, {
      computedDeps: [],
      autodetect: !isAsyncFunction(computeFunction),
    });
    this.agileInstance = () => agileInstance;
    this.computeFunction = computeFunction;
    this.config = {
      autodetect: config.autodetect as any,
    };

    // Extract Observer of passed hardcoded dependency instances
    // TODO support .output
    this.hardCodedDeps = extractObservers(config.computedDeps)
      .map((dep) => dep['value'])
      .filter((dep): dep is Observer => dep !== undefined);
    this.deps = new Set(this.hardCodedDeps);

    // Make this Observer depend on the specified hard coded dep Observers
    this.deps.forEach((observer) => {
      observer.addDependent(this.observers.value);
    });

    // Initial recompute to assign the computed initial value to the Computed
    // and autodetect missing dependencies
    this.recompute({ autodetect: config.autodetect, overwrite: true });
  }

  /**
   * Forces a recomputation of the cached value with the compute function.
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
    this.compute({ autodetect: config.autodetect }).then((result) => {
      this.observers.value.ingestValue(
        result,
        removeProperties(config, ['autodetect'])
      );
    });
    return this;
  }

  /**
   * Assigns a new function to the Computed Class for computing its value.
   *
   * The dependencies of the new compute function are automatically detected
   * and accordingly updated.
   *
   * An initial computation is performed with the new function
   * to change the obsolete cached value.
   *
   * [Learn more..](https://agile-ts.org/docs/core/computed/methods/#updatecomputefunction)
   *
   * @public
   * @param computeFunction - New function to compute the value of the Computed Class.
   * @param deps - Hard coded dependencies on which the Computed Class depends.
   * @param config - Configuration object
   */
  public updateComputeFunction(
    computeFunction: () => ComputedValueType,
    deps: Array<SubscribableAgileInstancesType> = [],
    config: RecomputeConfigInterface = {}
  ): this {
    config = defineConfig(config, {
      autodetect: this.config.autodetect,
    });

    // Make this Observer no longer depend on the old dep Observers
    this.deps.forEach((observer) => {
      observer.removeDependent(this.observers.value);
    });

    // Update dependencies of Computed
    // TODO support .output
    this.hardCodedDeps = extractObservers(deps)
      .map((dep) => dep['value'])
      .filter((dep): dep is Observer => dep !== undefined);
    this.deps = new Set(this.hardCodedDeps);

    // Make this Observer depend on the new hard coded dep Observers
    this.deps.forEach((observer) => {
      observer.addDependent(this.observers.value);
    });

    // Update computeFunction
    this.computeFunction = computeFunction;

    // Recompute to assign the new computed value to the Computed
    // and autodetect missing dependencies
    this.recompute(removeProperties(config, ['overwriteDeps']));

    return this;
  }

  /**
   * Computes and returns the new value of the Computed Class
   * and autodetects used dependencies in the compute function.
   *
   * @internal
   * @param config - Configuration object
   */
  public async compute(
    config: ComputeConfigInterface = {}
  ): Promise<ComputedValueType> {
    config = defineConfig(config, {
      autodetect: this.config.autodetect,
    });

    // Start auto tracking of Observers on which the computeFunction might depend
    if (config.autodetect) ComputedTracker.track();

    const computedValue = this.computeFunction();

    // Handle auto tracked Observers
    if (config.autodetect) {
      const foundDeps = ComputedTracker.getTrackedObservers();

      // Clean up old dependencies
      this.deps.forEach((observer) => {
        if (
          !foundDeps.includes(observer) &&
          !this.hardCodedDeps.includes(observer)
        ) {
          this.deps.delete(observer);
          observer.removeDependent(this.observers.value);
        }
      });

      // Make this Observer depend on the newly found dep Observers
      foundDeps.forEach((observer) => {
        if (!this.deps.has(observer)) {
          this.deps.add(observer);
          observer.addDependent(this.observers.value);
        }
      });
    }

    return computedValue;
  }

  /**
   * Not usable in Computed Class.
   */
  public persist(): this {
    LogCodeManager.log('19:03:00');
    return this;
  }
}

export type ComputeFunctionType<ComputedValueType = any> = () =>
  | ComputedValueType
  | Promise<ComputedValueType>;

export interface CreateComputedConfigInterface extends StateConfigInterface {
  /**
   * Hard-coded dependencies the Computed Class should depend on.
   * @default []
   */
  computedDeps?: Array<SubscribableAgileInstancesType>;
  /**
   * Whether the Computed should automatically detect
   * used dependencies in the specified compute method.
   *
   * Note that the automatic dependency detection does not work
   * in an asynchronous compute method!
   *
   * @default true if the compute method isn't asynchronous, otherwise false
   */
  autodetect?: boolean;
}

export interface ComputedConfigInterface {
  /**
   * Whether the Computed can automatically detect
   * used dependencies in the compute method.
   *
   * Note that the automatic dependency detection does not work
   * in an asynchronous compute method!
   *
   * @default true if the compute method isn't asynchronous, otherwise false
   */
  autodetect: boolean;
}

export interface ComputeConfigInterface {
  /**
   * Whether the Computed can automatically detect
   * used dependencies in the compute method.
   *
   * Note that the automatic dependency detection does not work
   * in an asynchronous compute method!
   *
   * @default true
   */
  autodetect?: boolean;
}

export interface RecomputeConfigInterface
  extends StateIngestConfigInterface,
    ComputeConfigInterface {}

export type SubscribableAgileInstancesType = State | Collection | Observer;
