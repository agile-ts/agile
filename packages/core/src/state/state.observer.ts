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
  public ingest(config: StateJobConfigInterface): void;
  /**
   * @internal
   * Ingests new State Value into Runtime and applies it to the State
   * @param newStateValue - New Value of the State
   * @param config - Config
   */
  public ingest(
    newStateValue: ValueType,
    config: StateJobConfigInterface
  ): void;
  public ingest(
    newStateValueOrConfig: ValueType | StateJobConfigInterface,
    config: StateJobConfigInterface = {}
  ): void {
    const state = this.state();
    let _newStateValue: ValueType;
    let _config: StateJobConfigInterface;

    if (isStateJobConfigInterface(newStateValueOrConfig)) {
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
      forceRerender: false,
      storage: true,
    });

    // If forceRerender, set background config to false since forceRerender is 'stronger' than background
    if (_config.forceRerender && _config.background) _config.background = false;

    // Assign next State Value and compute it if necessary
    this.nextStateValue = state.computeMethod
      ? copy(state.computeMethod(_newStateValue))
      : copy(_newStateValue);

    // Check if State Value and new/next Value are equals
    if (equal(state.value, this.nextStateValue) && !_config.forceRerender)
      return;

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

/**
 * @param forceRerender - Force rerender no matter what happens
 */
export interface StateJobConfigInterface extends JobConfigInterface {
  forceRerender?: boolean;
}

// https://stackoverflow.com/questions/40081332/what-does-the-is-keyword-do-in-typescript
export function isStateJobConfigInterface(
  object: any
): object is StateJobConfigInterface {
  return (
    object &&
    typeof object === "object" &&
    ("forceRerender" in object ||
      "perform" in object ||
      "background" in object ||
      "sideEffects" in object ||
      "storage" in object)
  );
}
