import { State, Agile, defineConfig, Observer } from "../internal";

export class Computed<ComputedValueType = any> extends State<
  ComputedValueType
> {
  public agileInstance: () => Agile;

  public computeFunction: () => ComputedValueType;
  public deps: Array<Observer> = []; // All Dependencies of Computed
  public hardCodedDeps: Array<Observer> = [];

  /**
   * @public
   * Computed - Function that recomputes its value if a dependency changes
   * @param agileInstance - An instance of Agile
   * @param computeFunction - Function for computing value
   * @param deps - Hard coded dependencies of Computed Function
   */
  constructor(
    agileInstance: Agile,
    computeFunction: () => ComputedValueType,
    deps: Array<Observer | State | Event> = []
  ) {
    super(agileInstance, computeFunction());
    this.agileInstance = () => agileInstance;
    this.computeFunction = computeFunction;
    this.hardCodedDeps = deps
      .map((dep) => dep["observer"] || undefined)
      .filter((dep) => dep !== undefined);

    // Recompute for setting initial value and adding missing dependencies
    this.recompute();
  }

  public set value(value: ComputedValueType) {
    console.error("Agile: You can't mutate Computed value!");
  }

  public get value(): ComputedValueType {
    // Note can't use 'super.value' because of 'https://github.com/Microsoft/TypeScript/issues/338'
    // Can't remove this getter function.. since the setter function is set in this class -> Error if not setter and getter function set

    // Add State to tracked Observers (for auto tracking used observers in computed function)
    if (this.agileInstance().runtime.trackObservers)
      this.agileInstance().runtime.foundObservers.add(this.observer);

    return this._value;
  }

  //=========================================================================================================
  // Recompute
  //=========================================================================================================
  /**
   * @public
   * Recomputes Function Value
   * -> Calls ComputeFunction and updates Dependencies of it
   * @param config - Config
   */
  public recompute(config?: RecomputeConfigInterface) {
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
    let foundDeps = Array.from(
      this.agileInstance().runtime.getTrackedObservers()
    );

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
  // Overwriting some functions which can't be used in Computed
  //=========================================================================================================

  public patch() {
    console.error("Agile: You can't use patch method on Computed Function!");
    return this;
  }

  public persist(key?: string): this {
    console.error("Agile: You can't use persist method on Computed Function!");
    return this;
  }

  public invert(): this {
    console.error("Agile: You can't use invert method on Computed Function!");
    return this;
  }
}

/**
 * @param background - If recomputing value will happen in the background (-> not causing any rerender)
 * @param sideEffects - If Side Effects of Computed will be executed
 */
export interface RecomputeConfigInterface {
  background?: boolean;
  sideEffects?: boolean;
}
