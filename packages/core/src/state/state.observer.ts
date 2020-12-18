import {
  Observer,
  State,
  Computed,
  Job,
  copy,
  defineConfig,
  ObserverKey,
  equal,
  notEqual,
  isFunction,
  SubscriptionContainer,
  IngestConfigInterface,
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
    super(state.agileInstance(), {
      deps: config.deps,
      value: state._value,
      key: config.key,
      subs: config.subs,
    });
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
  public ingest(config: IngestConfigInterface = {}): void {
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
    config: IngestConfigInterface = {}
  ): void {
    const state = this.state();
    config = defineConfig(config, {
      perform: true,
      background: false,
      sideEffects: true,
      force: false,
      storage: true,
    });

    // Assign next State Value and compute it if necessary
    this.nextStateValue = state.computeMethod
      ? copy(state.computeMethod(newStateValue))
      : copy(newStateValue);

    // Check if State Value and new/next Value are equals
    if (equal(state.value, this.nextStateValue) && !config.force) return;

    this.agileInstance().runtime.ingest(this, config);
  }

  //=========================================================================================================
  // Perform
  //=========================================================================================================
  /**
   * @internal
   * Performs Job from Runtime that holds this Observer
   * @param job - Job that gets performed
   */
  public perform(job: Job<this>) {
    const state = job.observer.state();

    // Set Previous State
    state.previousStateValue = copy(state.value);

    // Set new State Value
    state._value = copy(job.observer.nextStateValue);
    state.nextStateValue = copy(job.observer.nextStateValue);

    state.isSet = notEqual(
      job.observer.nextStateValue,
      state.initialStateValue
    );

    // Reset isPlaceholder and set initial/previous Value to nextValue because the placeholder State had no proper value before
    if (state.isPlaceholder) {
      state.initialStateValue = copy(state._value);
      state.previousStateValue = copy(state._value);
      state.isPlaceholder = false;
    }

    job.observer.value = copy(job.observer.nextStateValue);
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
  public sideEffects(job: Job<this>) {
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
