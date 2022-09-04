import { defineConfig, isAsyncFunction } from '@agile-ts/utils';
import type { Agile } from '../agile';
import { extractRelevantObservers } from '../utils';
import {
  State,
  StateConfigInterface,
  StateIngestConfigInterface,
} from '../state';
import type { Observer } from '../runtime';
import { ComputedTracker } from './computed.tracker';
import type { Collection } from '../collection';
import { logCodeManager } from '../logCodeManager';

export class Computed<
  ComputedValueType = any
> extends State<ComputedValueType> {
  public config: ComputedConfigInterface;

  // Caches whether the compute function is async
  public isComputeFunctionAsync!: boolean;

  // Function to compute the Computed Class value
  private _computeFunction!: ComputeFunctionType<ComputedValueType>;

  // All dependencies the Computed Class depends on (including hardCoded and automatically detected dependencies)
  public deps: Set<Observer> = new Set();
  // Only hardCoded dependencies the Computed Class depends on
  public hardCodedDeps: Array<Observer> = [];

  // Helper property to check whether an unknown instance is a Computed,
  // without importing the Computed itself for using 'instanceof' (Treeshaking support)
  public readonly isComputed = true;

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
    config: CreateComputedConfigInterface<ComputedValueType> = {}
  ) {
    super(
      agileInstance,
      // Assign inital value (if property set or not async)
      Object.prototype.hasOwnProperty.call(config, 'initialValue')
        ? config.initialValue
        : !isAsyncFunction(computeFunction)
        ? computeFunction()
        : (null as any),
      {
        key: config.key,
        dependents: config.dependents,
      }
    );
    this.computeFunction = computeFunction;

    config = defineConfig(config, {
      computedDeps: [],
      autodetect: !this.isComputeFunctionAsync, // 'isComputeFunctionAsync' will be set by assigning 'computeFunction'
    });
    this.agileInstance = () => agileInstance;
    this.config = {
      autodetect: config.autodetect as any,
    };

    // Extract Observer of passed hardcoded dependency instances
    this.hardCodedDeps = extractRelevantObservers(
      config.computedDeps as DependableAgileInstancesType[]
    ).filter((dep): dep is Observer => dep !== undefined);
    this.deps = new Set(this.hardCodedDeps);

    // Make this Observer depend on the specified hard coded dep Observers
    this.deps.forEach((observer) => {
      observer.addDependent(this.observers['value']);
    });

    // Initial recompute to assign the computed initial value to the Computed
    // and autodetect missing dependencies
    this.recompute({ autodetect: config.autodetect, overwrite: true });
  }

  /**
   * Returns the compute function of the Computed State
   *
   * @public
   */
  public get computeFunction(): ComputeFunctionType<ComputedValueType> {
    return this._computeFunction;
  }

  /**
   * Assigns a new compute function to the Computed State
   * and checks whether it's async.
   *
   * To update the compute function properly use 'updateComputeFunction()'!
   *
   * @internal
   * @param value - New compute function.
   */
  public set computeFunction(value: ComputeFunctionType<ComputedValueType>) {
    this._computeFunction = value;
    this.isComputeFunctionAsync = isAsyncFunction(value);
  }

  /**
   * Synchronously computes and returns the new value of the Computed Class
   * and autodetects used dependencies in the compute function.
   *
   * @internal
   * @param config - Configuration object
   */
  private computeSync(config: ComputeConfigInterface = {}): ComputedValueType {
    config = defineConfig(config, {
      autodetect: this.config.autodetect,
    });

    // Start auto tracking of Observers on which the computeFunction might depend
    if (config.autodetect) ComputedTracker.track();

    const computeFunction = this
      .computeFunction as SyncComputeFunctionType<ComputedValueType>;
    const computedValue = computeFunction();

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
          observer.removeDependent(this.observers['value']);
        }
      });

      // Make this Observer depend on the newly found dep Observers
      foundDeps.forEach((observer) => {
        if (!this.deps.has(observer)) {
          this.deps.add(observer);
          observer.addDependent(this.observers['value']);
        }
      });
    }

    return computedValue;
  }

  /**
   * Asynchronously computes and returns the new value of the Computed Class.
   * !! Since its async it can't autodetect used dependencies in the compute function.
   *
   * @internal
   */
  private async computeAsync(): Promise<ComputedValueType> {
    return this.computeFunction();
  }

  /**
   * Computes and returns the new value of the Computed Class
   * and autodetects used dependencies in a synchronous compute function.
   *
   * @internal
   * @param config - Configuration object
   */
  public async compute(
    config: ComputeConfigInterface = {}
  ): Promise<ComputedValueType> {
    if (config.autodetect && this.isComputeFunctionAsync) {
      logCodeManager.log('19:02:00');
    }
    return this.isComputeFunctionAsync
      ? this.computeAsync()
      : this.computeSync(config);
  }

  /**
   * Recomputes the value and ingests it into the runtime.
   *
   * @internal
   * @param config - Configuration object
   */
  public computeAndIngest(
    // https://www.reddit.com/r/learnjavascript/comments/q5rvux/pass_parent_config_object_directly_into_child/
    config: StateIngestConfigInterface & ComputeConfigInterface = {}
  ) {
    if (this.isComputeFunctionAsync) {
      this.computeAsync().then((result) => {
        this.observers['value'].ingestValue(result, config);
      });
    } else {
      const result = this.computeSync(config);
      this.observers['value'].ingestValue(result, config);
    }
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

    this.computeAndIngest(config);

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
    deps: Array<DependableAgileInstancesType> = [],
    config: RecomputeConfigInterface = {}
  ): this {
    config = defineConfig(config, {
      autodetect: this.config.autodetect,
    });

    // Make this Observer no longer depend on the old dep Observers
    this.deps.forEach((observer) => {
      observer.removeDependent(this.observers['value']);
    });

    // Update dependencies of Computed
    this.hardCodedDeps = extractRelevantObservers(deps).filter(
      (dep): dep is Observer => dep !== undefined
    );
    this.deps = new Set(this.hardCodedDeps);

    // Make this Observer depend on the new hard coded dep Observers
    this.deps.forEach((observer) => {
      observer.addDependent(this.observers['value']);
    });

    // Update computeFunction
    this.computeFunction = computeFunction;

    // Recompute to assign the new computed value to the Computed
    // and autodetect missing dependencies
    this.recompute(config);

    return this;
  }
}

export type SyncComputeFunctionType<ComputedValueType = any> =
  () => ComputedValueType;
export type AsyncComputeFunctionType<ComputedValueType = any> =
  () => Promise<ComputedValueType>;

export type ComputeFunctionType<ComputedValueType = any> =
  | SyncComputeFunctionType<ComputedValueType>
  | AsyncComputeFunctionType<ComputedValueType>;

export interface CreateComputedConfigInterface<ComputedValueType = any>
  extends StateConfigInterface {
  /**
   * Hard-coded dependencies the Computed Class should depend on.
   * @default []
   */
  computedDeps?: Array<DependableAgileInstancesType>;
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
  /**
   * Initial value of the Computed
   * which is temporarily set until the first computation has been completed.
   *
   * Note: Only really relevant if an async compute method is used.
   *
   * @default undefined
   */
  initialValue?: Awaited<ComputedValueType>; // https://stackoverflow.com/questions/48944552/typescript-how-to-unwrap-remove-promise-from-a-type
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

export type DependableAgileInstancesType =
  | State
  | Collection<any> //https://stackoverflow.com/questions/66987727/type-classa-id-number-name-string-is-not-assignable-to-type-classar
  | Observer;
