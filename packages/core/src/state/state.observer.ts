import {
  Observer,
  State,
  Computed,
  copy,
  defineConfig,
  ObserverKey,
  equal,
  notEqual,
  isFunction,
  SubscriptionContainer,
  IngestConfigInterface,
  StateRuntimeJob,
  StateRuntimeJobConfigInterface,
} from "../internal";

export class StateObserver<ValueType = any> extends Observer {
  public state: () => State<ValueType>;
  public nextStateValue: ValueType; // Next State value

  /**
   * @internal
   * State Observer - Handles State changes, dependencies (-> Interface to Runtime)
   * @param state - State
   * @param config - Config
   */
  constructor(
    state: State<ValueType>,
    config: CreateStateObserverConfigInterface = {}
  ) {
    super(state.agileInstance(), { ...config, ...{ value: state._value } });
    this.state = () => state;
    this.nextStateValue = copy(state._value);
  }

  //=========================================================================================================
  // Ingest
  //=========================================================================================================
  /**
   * @internal
   * Ingests nextStateValue or computedValue into Runtime and applies it to the State
   * @param config - Config
   */
  public ingest(config: StateIngestConfigInterface = {}): void {
    const state = this.state();
    let newStateValue: ValueType;

    if (state instanceof Computed) newStateValue = state.computeValue();
    else newStateValue = state.nextStateValue;

    this.ingestValue(newStateValue, config);
  }

  //=========================================================================================================
  // Ingest Value
  //=========================================================================================================
  /**
   * @internal
   * Ingests new State Value into Runtime and applies it to the State
   * @param newStateValue - New Value of the State
   * @param config - Config
   */
  public ingestValue(
    newStateValue: ValueType,
    config: StateIngestConfigInterface = {}
  ): void {
    const state = this.state();
    config = defineConfig(config, {
      perform: true,
      background: false,
      sideEffects: true,
      force: false,
      storage: true,
      overwrite: false,
    });

    // Force overwriting State because if setting Value the State shouldn't be a placeholder anymore
    if (state.isPlaceholder) {
      config.force = true;
      config.overwrite = true;
    }

    // Assign next State Value and compute it if necessary
    this.nextStateValue = state.computeMethod
      ? copy(state.computeMethod(newStateValue))
      : copy(newStateValue);

    // Check if State Value and new/next Value are equals
    if (equal(state._value, this.nextStateValue) && !config.force) return;

    // Create Job
    const job = new StateRuntimeJob(this, {
      storage: config.storage,
      sideEffects: config.sideEffects,
      force: config.force,
      background: config.background,
      overwrite: config.overwrite,
      key: this._key,
    });

    this.agileInstance().runtime.ingest(job, {
      perform: config.perform,
    });
  }

  //=========================================================================================================
  // Perform
  //=========================================================================================================
  /**
   * @internal
   * Performs Job that holds this Observer
   * @param job - Job
   */
  public perform(job: StateRuntimeJob) {
    const state = job.observer.state();

    // Assign new State Values
    state.previousStateValue = copy(state._value);
    state._value = copy(job.observer.nextStateValue);
    state.nextStateValue = copy(job.observer.nextStateValue);
    job.observer.value = copy(job.observer.nextStateValue);

    // Overwrite old State Values
    if (job.config.overwrite) {
      state.initialStateValue = copy(state._value);
      state.previousStateValue = copy(state._value);
      state.isPlaceholder = false;
    }

    state.isSet = notEqual(state._value, state.initialStateValue);

    this.sideEffects(job);
  }

  //=========================================================================================================
  // Side Effect
  //=========================================================================================================
  /**
   * @internal
   * SideEffects of Job
   * @param job - Job
   */
  public sideEffects(job: StateRuntimeJob) {
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
    state.observer.deps.forEach(
      (observer) =>
        observer instanceof StateObserver && observer.ingest({ perform: false })
    );
  }
}

/**
 * @param deps - Initial Dependencies of State Observer
 * @param subs - Initial Subscriptions of State Observer
 * @param key - Key/Name of State Observer
 */
export interface CreateStateObserverConfigInterface {
  deps?: Array<Observer>;
  subs?: Array<SubscriptionContainer>;
  key?: ObserverKey;
}

export interface StateIngestConfigInterface
  extends StateRuntimeJobConfigInterface,
    IngestConfigInterface {}
