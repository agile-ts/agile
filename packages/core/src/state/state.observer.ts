import {
  copy,
  createArrayFromObject,
  defineConfig,
  equal,
  generateId,
  isFunction,
  notEqual,
} from '@agile-ts/utils';
import {
  IngestConfigInterface,
  Observer,
  ObserverKey,
  SubscriptionContainer,
} from '../runtime';
import {
  CreateStateRuntimeJobConfigInterface,
  StateRuntimeJob,
} from './state.runtime.job';
import { SideEffectInterface, State } from './state';
import { logCodeManager } from '../logCodeManager';
import { Computed } from '../computed';

export class StateObserver<ValueType = any> extends Observer<ValueType> {
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
    config: CreateStateObserverConfigInterface = {}
  ) {
    super(
      state.agileInstance(),
      defineConfig(config, {
        value: copy(state._value),
      })
    );
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

    if (state instanceof Computed && state.isComputed) {
      state.computeAndIngest(config);
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
      force: false,
      key: logCodeManager.allowLogging
        ? `${this.key != null ? this.key + '_' : ''}${generateId()}_value`
        : undefined,
    });

    // Force overwriting the State value if it is a placeholder.
    // After assigning a value to the State, the State is supposed to be no placeholder anymore.
    if (state.isPlaceholder) {
      config.force = true;
      config.overwrite = true;
    }

    // Assign next State value to Observer and compute it if necessary (enhanced State)
    this.nextStateValue = (state as any).computeValueMethod
      ? copy((state as any).computeValueMethod(newStateValue))
      : copy(newStateValue);

    // Check if current State value and to assign State value are equal
    if (equal(state._value, this.nextStateValue) && !config.force) return;

    // Create Runtime-Job
    const job = new StateRuntimeJob(this, config);

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

    // Overwrite entire State with the newly assigned value
    if (job.config.overwrite) {
      state.initialStateValue = copy(state._value);
      state.previousStateValue = copy(state._value);
      state.isPlaceholder = false;
    }

    state.isSet = notEqual(state._value, state.initialStateValue);
    this.sideEffects(job);

    // Assign new public value to the Observer (value used by the Integrations)
    job.observer.previousValue = copy(observer.value); // Object.freeze(copy(observer.value)); // Not freezing because it leads to issues when working with classes
    job.observer.value = copy(state._value); // Object.freeze(copy(state._value)); // Not freezing because of 'useProxy' hook
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
    if (Object.keys(state.sideEffects).length === 0) return;

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

export interface CreateStateObserverConfigInterface {
  /**
   * Initial Observers to depend on the Observer.
   * @default []
   */
  dependents?: Array<Observer>;
  /**
   * Initial Subscription Containers the Observer is subscribed to.
   * @default []
   */
  subs?: Array<SubscriptionContainer>;
  /**
   * Key/Name identifier of the Observer.
   * @default undefined
   */
  key?: ObserverKey;
}

export interface StateIngestConfigInterface
  extends CreateStateRuntimeJobConfigInterface,
    IngestConfigInterface {}
