import { State, Agile, defineConfig, Observer } from "../internal";

export class Computed<ComputedValueType = any> extends State<
  ComputedValueType
> {
  public agileInstance: () => Agile;

  public computeFunction: () => ComputedValueType;
  public deps: Array<Observer> = [];
  public hardCodedDeps: Array<Observer> = [];

  /**
   * @public
   * Computed - Computes value from provided function.
   * This value will be recomputed if one detected or given dependency changes.
   * @param {Agile} agileInstance - An instance of Agile
   * @param {() => ComputedValueType} computeFunction - Function which recomputes if a dependency in it changes
   * @param { Array<Observer | State | Event>} deps - Initial deps of the Computed Function
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

    // Recompute for setting initial state value and adding missing dependencies
    this.recompute();
  }

  public set value(value: ComputedValueType) {
    console.error("Agile: Can't mutate Computed value!");
  }

  public get value(): ComputedValueType {
    // Note can't use 'super.value' because of 'https://github.com/Microsoft/TypeScript/issues/338'
    // Can't remove this getter function.. since the setter function is set in this class -> Error if not setter and getter set

    // Add state to foundState (for auto tracking used states in computed functions)
    if (this.agileInstance().runtime.trackObservers)
      this.agileInstance().runtime.foundObservers.add(this.observer);

    return this._value;
  }

  //=========================================================================================================
  // Recompute
  //=========================================================================================================
  /**
   * @public
   * Recomputes Function Value -> calls ComputeFunction and updates her dependencies
   * @param {RecomputeConfigInterface} config - Config
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
   * Updates the Compute Function
   */
  public updateComputeFunction(
    computeFunction: () => ComputedValueType,
    deps: Array<State> = [],
    config?: RecomputeConfigInterface
  ) {
    this.computeFunction = computeFunction;
    this.hardCodedDeps = deps.map((state) => state.observer);

    // Recompute for setting initial state value and adding missing dependencies
    this.recompute(config);
  }

  //=========================================================================================================
  // Compute Values
  //=========================================================================================================
  /**
   * @internal
   * Will add auto tracked dependencies to this and calls the computeFunction
   */
  public computeValue(): ComputedValueType {
    // Set tracking state to true which will than track all states which for instance call state.value
    this.agileInstance().runtime.trackObservers = true;

    // Call computeFunction
    const computedValue = this.computeFunction();

    // Get tracked states and set trackSate to false
    let foundObservers = this.agileInstance().runtime.getTrackedObservers();

    // Handle foundStates dependencies
    const newDeps: Array<Observer> = [];
    foundObservers.forEach((observer) => {
      if (!observer) return;

      // Add the state to newDeps
      newDeps.push(observer);

      // Add this as dependency of the state
      observer.depend(this.observer);
    });

    // Handle hardCoded dependencies
    this.hardCodedDeps.forEach((observer) => {
      // Add this as dependency of the state
      observer.depend(this.observer);
    });

    // Set deps
    this.deps = [...this.hardCodedDeps, ...newDeps];

    return computedValue;
  }

  //=========================================================================================================
  // Overwriting some functions which can't be used in computed
  //=========================================================================================================

  public patch() {
    console.error(
      "Agile: can not use patch method on Computed since the value is dynamic!"
    );
    return this;
  }

  public persist(key?: string): this {
    console.error(
      "Agile: Computed state can not be persisted since the value is dynamic!",
      key
    );
    return this;
  }
}

/**
 * @param {boolean} background - If recomputing should happen in the background -> not causing a rerender
 * @param {boolean} sideEffects - If Side Effects of the Computed should get executed (sideEffects)
 */
export interface RecomputeConfigInterface {
  background?: boolean;
  sideEffects?: boolean;
}
