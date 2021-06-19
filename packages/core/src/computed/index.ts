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
  // Agile Instance the Computed belongs to
  public agileInstance: () => Agile;

  public config: ComputedConfigInterface;

  // Function to compute the Computed Class value
  public computeFunction: ComputeFunctionType<ComputedValueType>;
  // All dependencies the Computed Class depends on (including hardCoded and automatically detected dependencies)
  public deps: Array<Observer> = [];
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
      autodetect: true,
    });
    this.agileInstance = () => agileInstance;
    this.computeFunction = computeFunction;
    this.observer.async = true; // isAsyncFunction(computeFunction); // Not reliable enough
    this.config = {
      autodetect: config.autodetect as any,
    };

    // Extract Observer of passed hardcoded dependency instances
    this.hardCodedDeps = extractObservers(config.computedDeps).filter(
      (dep): dep is Observer => dep !== undefined
    );
    this.deps = this.hardCodedDeps;

    // Initial recompute to assign initial value and autodetect missing dependencies
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
      this.observer.ingestValue(
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
    config: UpdateComputeFunctionConfigInterface = {}
  ): this {
    config = defineConfig(config, {
      overwriteDeps: true,
      autodetect: this.config.autodetect,
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

    const computedValue = await this.computeFunction();

    // Handle auto tracked Observers
    if (config.autodetect) {
      const foundDeps = ComputedTracker.getTrackedObservers();
      const newDeps: Array<Observer> = [];
      this.hardCodedDeps.concat(foundDeps).forEach((observer) => {
        newDeps.push(observer);

        // Make this Observer depend on the found dep Observers
        observer.addDependent(this.observer);
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

export type ComputeFunctionType<ComputedValueType = any> = () =>
  | ComputedValueType
  | Promise<ComputedValueType>;

export interface CreateComputedConfigInterface extends StateConfigInterface {
  /**
   * Hard-coded dependencies on which the Computed Class should depend.
   * @default []
   */
  computedDeps?: Array<SubscribableAgileInstancesType>;
  /**
   * Whether the Computed can automatically detect
   * used dependencies in the compute method.
   * @default true
   */
  autodetect?: boolean;
}

export interface ComputedConfigInterface {
  /**
   * Whether the Computed can automatically detect
   * used dependencies in the compute method.
   * @default true when compute method isn't async otherwise false
   */
  autodetect: boolean;
}

export interface ComputeConfigInterface {
  /**
   * Whether to automatically detect used dependencies in the compute method.
   * @default true
   */
  autodetect?: boolean;
}

export interface UpdateComputeFunctionConfigInterface
  extends RecomputeConfigInterface {
  /**
   * Whether to overwrite the old hard-coded dependencies with the new ones
   * or merge them into the new ones.
   * @default false
   */
  overwriteDeps?: boolean;
}

export interface RecomputeConfigInterface
  extends StateIngestConfigInterface,
    ComputeConfigInterface {}

export type SubscribableAgileInstancesType = State | Collection | Observer;
