import {
  Observer,
  State,
  Computed,
  copy,
  defineConfig,
  equal,
  notEqual,
  isFunction,
  IngestConfigInterface,
  StateRuntimeJob,
  SideEffectInterface,
  createArrayFromObject,
  CreateStateRuntimeJobConfigInterface,
  generateId,
  CreateObserverConfigInterface,
} from '../internal';

export class StateObserver<ValueType = any> extends Observer {
  // State the Observer belongs to
  public state: () => State<ValueType>;

  // Next value applied to the State
  public nextStateValue: ValueType;

  /**
   * A State Observer manages the subscriptions to Subscription Containers (UI-Components)
   * and dependencies to other Observers (Agile Classes)
   * for a State Class.
   *
   * @internal
   * @param state - Instance of State the Observer belongs to.
   * @param config - Configuration object
   */
  constructor(
    state: State<ValueType>,
    config: CreateObserverConfigInterface = {}
  ) {
    super(state.agileInstance(), { ...config, ...{ value: state._value } });
    this.state = () => state;
    this.nextStateValue = copy(state._value);
  }

  /**
   * Passes the State Observer into the runtime wrapped into a Runtime-Job
   * where it is executed accordingly.
   *
   * During the execution the runtime applies the `nextStateValue`
   * or the `computedValue` (Computed Class) to the State,
   * updates its dependents and re-renders the UI-Components it is subscribed to.
   *
   * @internal
   * @param config - Configuration object
   */
  public ingest(config: StateIngestConfigInterface = {}): void {
    const state = this.state();

    if (state instanceof Computed) {
      state.compute().then((result) => {
        this.ingestValue(result, config);
      });
    } else {
      this.ingestValue(state.nextStateValue, config);
    }
  }

  /**
   * Passes the State Observer into the runtime wrapped into a Runtime-Job
   * where it is executed accordingly.
   *
   * During the execution the runtime applies the specified `newStateValue` to the State,
   * updates its dependents and re-renders the UI-Components it is subscribed to.
   *
   * @internal
   * @param newStateValue - New value to be applied to the State.
   * @param config - Configuration object.
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
      maxTriesToUpdate: 3,
    });

    // Force overwriting the State value if it is a placeholder.
    // After assigning a value to the State, it is supposed to be no placeholder anymore.
    if (state.isPlaceholder) {
      config.force = true;
      config.overwrite = true;
    }

    // Assign next State value to Observer and compute it if necessary
    this.nextStateValue = state.computeValueMethod
      ? copy(state.computeValueMethod(newStateValue))
      : copy(newStateValue);

    // Check if current State value and to assign State value are equal
    if (equal(state._value, this.nextStateValue) && !config.force) return;

    // Create Runtime-Job
    const job = new StateRuntimeJob(this, {
      storage: config.storage,
      sideEffects: config.sideEffects,
      force: config.force,
      background: config.background,
      overwrite: config.overwrite,
      key:
        config.key ??
        `${this._key != null ? this._key + '_' : ''}${generateId()}_value`,
      maxTriesToUpdate: config.maxTriesToUpdate,
    });

    // Pass created Job into the Runtime
    this.agileInstance().runtime.ingest(job, {
      perform: config.perform,
    });
  }

  /**
   * Method executed by the Runtime to perform the Runtime-Job,
   * previously ingested via the `ingest()` or `ingestValue()` method.
   *
   * Thereby the previously defined `nextStateValue` is assigned to the State.
   * Also side effects (like calling watcher callbacks) of a State change are executed.
   *
   * @internal
   * @param job - Runtime-Job to be performed.
   */
  public perform(job: StateRuntimeJob) {
    const observer = job.observer;
    const state = observer.state();

    // Assign new State values
    state.previousStateValue = copy(state._value);
    state._value = copy(observer.nextStateValue);
    state.nextStateValue = copy(observer.nextStateValue);

    // TODO think about freezing the State value..
    // https://www.geeksforgeeks.org/object-freeze-javascript/#:~:text=Object.freeze()%20Method&text=freeze()%20which%20is%20used,the%20prototype%20of%20the%20object.
    // if (typeof state._value === 'object') Object.freeze(state._value);

    // Overwrite entire State with the newly assigned value
    if (job.config.overwrite) {
      state.initialStateValue = copy(state._value);
      state.previousStateValue = copy(state._value);
      state.isPlaceholder = false;
    }

    state.isSet = notEqual(state._value, state.initialStateValue);
    this.sideEffects(job);

    // Assign new public value to the Observer
    job.observer.previousValue = copy(observer.value);
    job.observer.value = copy(state._value);
  }

  /**
   * Performs the side effects of applying the next State value to the State.
   *
   * Side effects are, for example, calling the watcher callbacks
   * or executing the side effects defined in the State Class
   * like 'rebuildGroup' or 'rebuildStateStorageValue'.
   *
   * @internal
   * @param job - Job that is currently performed.
   */
  public sideEffects(job: StateRuntimeJob) {
    const state = job.observer.state();

    // Call watcher functions
    for (const watcherKey in state.watchers)
      if (isFunction(state.watchers[watcherKey]))
        state.watchers[watcherKey](state._value, watcherKey);

    // Call side effect functions
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

export interface StateIngestConfigInterface
  extends CreateStateRuntimeJobConfigInterface,
    IngestConfigInterface {}
