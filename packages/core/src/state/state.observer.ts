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
  SideEffectInterface,
  createArrayFromObject,
  CreateStateRuntimeJobConfigInterface,
} from '../internal';

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
      sideEffects: {
        enabled: true,
        exclude: [],
      },
      force: false,
      storage: true,
      overwrite: false,
    });

    // Force overwriting State because if assigning Value to State, the State shouldn't be a placeholder anymore
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
      key: config.key || this._key,
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

    // Overwrite old State Values
    if (job.config.overwrite) {
      state.initialStateValue = copy(state._value);
      state.previousStateValue = copy(state._value);
      state.isPlaceholder = false;
    }

    state.isSet = notEqual(state._value, state.initialStateValue);

    this.sideEffects(job);

    // Assign Public Value to Observer after sideEffects like 'rebuildGroup',
    // because sometimes (for instance in Group) the publicValue is not the value(nextStateValue)
    // and the observer value is at some point the publicValue because the end user uses it
    job.observer.value = copy(state.getPublicValue());
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
    for (const watcherKey in state.watchers)
      if (isFunction(state.watchers[watcherKey]))
        state.watchers[watcherKey](state.getPublicValue(), watcherKey);

    // Call SideEffect Functions
    if (job.config?.sideEffects?.enabled) {
      const sideEffectArray = createArrayFromObject<
        SideEffectInterface<State<ValueType>>
      >(state.sideEffects);
      sideEffectArray.sort(function (a, b) {
        return b.instance.weight - a.instance.weight;
      });
      for (const sideEffect of sideEffectArray) {
        if (isFunction(sideEffect.instance.callback)) {
          if (!job.config.sideEffects.exclude?.includes(sideEffect.key))
            sideEffect.instance.callback(job.observer.state(), job.config);
        }
      }
    }
  }
}

/**
 * @param dependents - Initial Dependents of State Observer
 * @param subs - Initial Subscriptions of State Observer
 * @param key - Key/Name of State Observer
 */
export interface CreateStateObserverConfigInterface {
  dependents?: Array<Observer>;
  subs?: Array<SubscriptionContainer>;
  key?: ObserverKey;
}

export interface StateIngestConfigInterface
  extends CreateStateRuntimeJobConfigInterface,
    IngestConfigInterface {}
