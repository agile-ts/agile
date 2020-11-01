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

export const internalIngestKey =
  "THIS_IS_AN_INTERNAL_KEY_FOR_INGESTING_INTERNAL_STUFF";

export class StateObserver<ValueType = any> extends Observer {
  public state: () => State<ValueType>;
  public nextStateValue: ValueType; // Next State value

  /**
   * @internal
   * State Observer - Handles State changes, dependencies (-> Interface to Runtime)
   * @param agileInstance - An instance of Agile
   * @param state - State
   * @param deps - Initial Dependencies of State Observer
   * @param key - Key/Name of State Observer
   */
  constructor(
    agileInstance: Agile,
    state: State<ValueType>,
    deps?: Array<Observer>,
    key?: ObserverKey
  ) {
    super(agileInstance, deps, key, state.value);
    this.state = () => state;
    this.nextStateValue = state.value;
  }

  //=========================================================================================================
  // Ingest
  //=========================================================================================================
  /**
   * @internal
   * Ingests new State Value into Runtime and applies it to the State
   * @param newStateValue - New Value of the State
   * @param config - Config
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
      storage: true,
    });

    // If forceRerender, set background config to false since forceRerender is 'stronger' than background
    if (config.forceRerender && config.background) config.background = false;

    // Grab nextState or compute State if internalIngestKey got passed
    if (newStateValue === internalIngestKey) {
      if (state instanceof Computed) this.nextStateValue = state.computeValue();
      else this.nextStateValue = state.nextStateValue;
    } else this.nextStateValue = newStateValue;

    // Check if State Value and the new Value are equals (Note: Not checking state.nextStateValue because of the internalIngestKey ;D)
    if (equal(state.value, this.nextStateValue) && !config.forceRerender) {
      if (this.agileInstance().config.logJobs)
        console.warn(
          "Agile: Doesn't created job because state values are the same! "
        );
      return;
    }

    this.agileInstance().runtime.ingest(this, config);
  }

  //=========================================================================================================
  // Perform
  //=========================================================================================================
  /**
   * @internal
   * Performs Job from Runtime
   * @param job - Job that gets performed
   */
  public perform(job: Job<this>) {
    const state = job.observer.state();

    // Set Previous State
    state.previousStateValue = copy(state.value);

    // Set new State Value
    state._value = copy(this.nextStateValue);
    state.nextStateValue = copy(this.nextStateValue);

    // Store State changes in Storage
    if (job.config.storage) state.persistent?.updateValue();

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
   * SideEffects of Perform Function
   * @param job - Job whose SideEffects gets executed
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
          state.sideEffects[sideEffectKey](job.config);

    // Ingest Dependencies of Observer into Runtime
    job.observer.deps.forEach(
      (observer) =>
        observer instanceof StateObserver &&
        observer.ingest(internalIngestKey, { perform: false })
    );
  }
}

export type InternalIngestKeyType = "THIS_IS_AN_INTERNAL_KEY_FOR_INGESTING_INTERNAL_STUFF";

/**
 * @param forceRerender - Force rerender no matter what happens
 */
export interface StateJobConfigInterface extends JobConfigInterface {
  forceRerender?: boolean;
}
