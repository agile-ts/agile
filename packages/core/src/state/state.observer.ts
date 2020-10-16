import {
  Agile,
  Observer,
  State,
  Computed,
  Job,
  JobConfigInterface,
  copy,
  defineConfig,
  ObserverKey,
  equal,
  notEqual,
  isFunction,
} from "../internal";

export type InternalIngestKeyType = "THIS_IS_AN_INTERNAL_KEY_FOR_INGESTING_INTERNAL_STUFF";
export const internalIngestKey =
  "THIS_IS_AN_INTERNAL_KEY_FOR_INGESTING_INTERNAL_STUFF";

/**
 * @param {boolean} forceRerender - Force rerender no matter what happens
 */
export interface StateJobConfigInterface extends JobConfigInterface {
  forceRerender?: boolean;
}

export class StateObserver<ValueType = any> extends Observer {
  public state: () => State<ValueType>; // State where the Observer is the runtime interface
  public nextStateValue: ValueType; // Next State value
  public value: ValueType; // Current State value

  /**
   * @internal
   * State Observer
   * @param {Agile} agileInstance - An instance of Agile
   * @param {State} state - State
   * @param {Array<Observer>} deps - Initial Dependencies of the State
   * @param {ObserverKey} key - Key/Name of the Observer
   */
  constructor(
    agileInstance: Agile,
    state: State,
    deps?: Array<Observer>,
    key?: ObserverKey
  ) {
    super(agileInstance, deps, key);
    this.state = () => state;
    this.nextStateValue = state.value;
    this.value = state.value;
  }

  //=========================================================================================================
  // Ingest
  //=========================================================================================================
  /**
   * @internal
   * Ingests the newStateValue into the Runtime
   * @param {any} newStateValue - New State Value
   * @param {JobConfigInterface} config - Config
   */
  public ingest(
    newStateValue: ValueType | InternalIngestKeyType = internalIngestKey,
    config: StateJobConfigInterface = {}
  ): void {
    const state = this.state();

    config = defineConfig<JobConfigInterface>(config, {
      perform: true,
      background: false,
      sideEffects: true,
      forceRerender: false,
    });

    // If forceRerender.. set background to false since forceRerender is 'stronger' than background
    if (config.forceRerender && config.background) config.background = false;

    // Grab nextState or compute the State if internalIngestKey got passed
    if (newStateValue === internalIngestKey) {
      if (state instanceof Computed) this.nextStateValue = state.computeValue();
      else this.nextStateValue = state.nextStateValue;
    } else this.nextStateValue = newStateValue;

    // If nextStateValue and currentValue are equals return
    if (equal(state.value, this.nextStateValue) && !config.forceRerender) {
      if (this.agileInstance().config.logJobs)
        console.warn(
          "Agile: Doesn't created job because state values are the same! "
        );
      return;
    }

    // Ingest into runtime
    this.agileInstance().runtime.ingest(this, config);
  }

  //=========================================================================================================
  // Perform
  //=========================================================================================================
  /**
   * @internal
   * Performs a Job
   * @param {Job<this>} job - The Job which should be performed
   */
  public perform(job: Job<this>) {
    const state = job.observer.state();

    // Set Previous State
    state.previousStateValue = copy(state.value);

    // Write new value into the State
    state.privateWrite(this.nextStateValue);

    // Set isSet
    state.isSet = notEqual(this.nextStateValue, state.initialStateValue);

    // Reset isPlaceholder since it got an value
    if (state.isPlaceholder) state.isPlaceholder = false;

    // Update Observer value
    this.value = this.nextStateValue;

    // Perform SideEffects of the Perform Function
    this.sideEffects(job);
  }

  //=========================================================================================================
  // Side Effect
  //=========================================================================================================
  /**
   * @internal
   * SideEffects of the Perform Function
   * @param {Job<this>} job - The Job where the sideEffects should be executed
   */
  private sideEffects(job: Job<this>) {
    const state = job.observer.state();

    // Call Watchers Functions
    for (let watcherKey in state.watchers)
      if (isFunction(state.watchers[watcherKey]))
        state.watchers[watcherKey](state.getPublicValue());

    // Call SideEffect Functions
    if (job.config?.sideEffects)
      for (let sideEffectKey in state.sideEffects)
        if (isFunction(state.sideEffects[sideEffectKey]))
          state.sideEffects[sideEffectKey]();

    // Ingest Dependencies of State into Runtime (for instance ComputedValues)
    job.observer.dep.deps.forEach(
      (observer) =>
        observer instanceof StateObserver &&
        observer.ingest(internalIngestKey, { perform: false })
    );
  }
}
