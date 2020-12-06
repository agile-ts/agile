import {
  Agile,
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
   * @param agileInstance - An instance of Agile
   * @param state - State
   * @param config - Config
   */
  constructor(
    agileInstance: Agile,
    state: State<ValueType>,
    config: CreateStateObserverConfigInterface = {}
  ) {
    config = defineConfig(config, {
      deps: [],
      subs: [],
    });
    super(agileInstance, {
      deps: config.deps,
      value: state.value,
      key: config.key,
      subs: config.subs,
    });
    this.state = () => state;
    this.nextStateValue = copy(state.value);
  }

  //=========================================================================================================
  // Ingest
  //=========================================================================================================
  /**
   * @internal
   * Ingests nextStateValue into Runtime and applies it to the State
   * @param config - Config
   */
  public ingest(config: IngestConfigInterface): void;
  /**
   * @internal
   * Ingests new State Value into Runtime and applies it to the State
   * @param newStateValue - New Value of the State
   * @param config - Config
   */
  public ingest(newStateValue: ValueType, config: IngestConfigInterface): void;
  public ingest(
    newStateValueOrConfig: ValueType | IngestConfigInterface,
    config: IngestConfigInterface = {}
  ): void {
    const state = this.state();
    let _newStateValue: ValueType;
    let _config: IngestConfigInterface;

    if (isStateIngestConfigInterface(newStateValueOrConfig)) {
      _config = newStateValueOrConfig;
      if (state instanceof Computed) _newStateValue = state.computeValue();
      else _newStateValue = state.nextStateValue;
    } else {
      _config = config;
      _newStateValue = newStateValueOrConfig;
    }

    _config = defineConfig(_config, {
      perform: true,
      background: false,
      sideEffects: true,
      force: false,
      storage: true,
    });

    // Assign next State Value and compute it if necessary
    this.nextStateValue = state.computeMethod
      ? copy(state.computeMethod(_newStateValue))
      : copy(_newStateValue);

    // Check if State Value and new/next Value are equals
    if (equal(state.value, this.nextStateValue) && !_config.force) return;

    this.agileInstance().runtime.ingest(this, _config);
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
    if (job.config.storage && state.isPersisted)
      state.persistent?.updateValue();

    // Set isSet
    state.isSet = notEqual(this.nextStateValue, state.initialStateValue);

    // Reset isPlaceholder and set initial/previous Value to nextValue because the placeholder State had no proper value before
    if (state.isPlaceholder) {
      state.initialStateValue = copy(state.value);
      state.previousStateValue = copy(state.value);
      state.isPlaceholder = false;
    }

    // Update Observer value
    this.value = copy(this.nextStateValue);

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
        observer instanceof StateObserver && observer.ingest({ perform: false })
    );
  }
}

// https://stackoverflow.com/questions/40081332/what-does-the-is-keyword-do-in-typescript
export function isStateIngestConfigInterface(
  object: any
): object is IngestConfigInterface {
  return (
    object &&
    typeof object === "object" &&
    ("force" in object ||
      "perform" in object ||
      "background" in object ||
      "sideEffects" in object ||
      "storage" in object)
  );
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
