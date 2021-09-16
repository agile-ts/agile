import { Agile } from '../agile';
import { copy, defineConfig, isFunction } from '@agile-ts/utils';
import { StateIngestConfigInterface, StateObserver } from './state.observer';
import { ComputedTracker } from '../computed/computed.tracker'; // Not imported directly from '../computed' due circular dependencies
import { LogCodeManager } from '../logCodeManager';
import { Observer } from '../runtime';

export class State<ValueType = any> {
  // Agile Instance the State belongs to
  public agileInstance: () => Agile;

  // Key/Name identifier of the State
  public _key?: StateKey;
  // Whether the current value differs from the initial value
  public isSet = false;
  // Whether the State is a placeholder and only exist in the background
  public isPlaceholder = false;

  // First value assigned to the State
  public initialStateValue: ValueType;
  // Current value of the State
  public _value: ValueType;
  // Previous value of the State
  public previousStateValue: ValueType;
  // Next value of the State (which can be used for dynamic State updates)
  public nextStateValue: ValueType;

  // Manages dependencies to other States and subscriptions of UI-Components.
  // It also serves as an interface to the runtime.
  public observers: StateObserversInterface<ValueType> = {} as any;
  // Registered side effects of changing the State value
  public sideEffects: {
    [key: string]: SideEffectInterface<State<ValueType>>;
  } = {};

  /**
   * A State manages a piece of Information
   * that we need to remember globally at a later point in time.
   * While providing a toolkit to use and mutate this piece of Information.
   *
   * You can create as many global States as you need.
   *
   * [Learn more..](https://agile-ts.org/docs/core/state/)
   *
   * @public
   * @param agileInstance - Instance of Agile the State belongs to.
   * @param initialValue - Initial value of the State.
   * @param config - Configuration object
   */
  constructor(
    agileInstance: Agile,
    initialValue: ValueType,
    config: StateConfigInterface = {}
  ) {
    config = defineConfig(config, {
      dependents: [],
      isPlaceholder: false,
    });
    this.agileInstance = () => agileInstance;
    this._key = config.key;
    this.observers['value'] = new StateObserver<ValueType>(this, {
      key: config.key,
      dependents: config.dependents,
    });
    this.initialStateValue = copy(initialValue);
    this._value = copy(initialValue);
    this.previousStateValue = copy(initialValue);
    this.nextStateValue = copy(initialValue);
    this.isPlaceholder = true;

    // Set State value to specified initial value
    if (!config.isPlaceholder) this.set(initialValue, { overwrite: true });
  }

  /**
   * Assigns a new value to the State
   * and rerenders all subscribed Components.
   *
   * [Learn more..](https://agile-ts.org/docs/core/state/properties#value)
   *
   * @public
   * @param value - New State value.
   */
  public set value(value: ValueType) {
    this.set(value);
  }

  /**
   * Returns a reference-free version of the current State value.
   *
   * [Learn more..](https://agile-ts.org/docs/core/state/properties#value)
   *
   * @public
   */
  public get value(): ValueType {
    ComputedTracker.tracked(this.observers['value']);
    return copy(this._value);
  }

  /**
   * Updates the key/name identifier of the State.
   *
   * [Learn more..](https://agile-ts.org/docs/core/state/properties#key)
   *
   * @public
   * @param value - New key/name identifier.
   */
  public set key(value: StateKey | undefined) {
    this.setKey(value);
  }

  /**
   * Returns the key/name identifier of the State.
   *
   * [Learn more..](https://agile-ts.org/docs/core/state/properties#key)
   *
   * @public
   */
  public get key(): StateKey | undefined {
    return this._key;
  }

  /**
   * Updates the key/name identifier of the State.
   *
   * [Learn more..](https://agile-ts.org/docs/core/state/methods/#setkey)
   *
   * @public
   * @param value - New key/name identifier.
   */
  public setKey(value: StateKey | undefined): this {
    // Update State key
    this._key = value;

    // Update key of Observers
    for (const observerKey in this.observers)
      this.observers[observerKey]._key = value;

    return this;
  }

  /**
   * Assigns a new value to the State
   * and re-renders all subscribed UI-Components.
   *
   * [Learn more..](https://agile-ts.org/docs/core/state/methods/#set)
   *
   * @public
   * @param value - New State value
   * @param config - Configuration object
   */
  public set(
    value: ValueType | ((value: ValueType) => ValueType),
    config: StateIngestConfigInterface = {}
  ): this {
    config = defineConfig(config, {
      force: false,
    });
    const _value = isFunction(value)
      ? (value as any)(copy(this._value))
      : value;

    // Ingest the State with the new value into the runtime
    this.observers['value'].ingestValue(_value, config);

    return this;
  }

  /**
   * Ingests the State without any specified new value into the runtime.
   *
   * Since no new value was defined either the new State value is computed
   * based on a compute method (Computed Class)
   * or the `nextStateValue` is taken as the next State value.
   *
   * [Learn more..](https://agile-ts.org/docs/core/state/methods/#ingest)
   *
   * @internal
   * @param config - Configuration object
   */
  public ingest(config: StateIngestConfigInterface = {}): this {
    this.observers['value'].ingest(config);
    return this;
  }

  /**
   *
   * Registers a `callback` function that is executed in the `runtime`
   * as a side effect of State changes.
   *
   * For example, it is called when the State value changes from 'jeff' to 'hans'.
   *
   * A typical side effect of a State change
   * could be the updating of the external Storage value.
   *
   * @internal
   * @param key - Key/Name identifier of the to register side effect.
   * @param callback - Callback function to be fired on each State value change.
   * @param config - Configuration object
   */
  public addSideEffect<Instance extends State<ValueType>>(
    key: string,
    callback: SideEffectFunctionType<Instance>,
    config: AddSideEffectConfigInterface = {}
  ): this {
    config = defineConfig(config, {
      weight: 10,
    });
    if (!isFunction(callback)) {
      LogCodeManager.log('00:03:01', ['Side Effect Callback', 'function']);
      return this;
    }
    this.sideEffects[key] = {
      callback: callback as any,
      weight: config.weight as any,
    };
    return this;
  }

  /**
   * Removes a side effect callback with the specified key/name identifier from the State.
   *
   * [Learn more..](https://agile-ts.org/docs/core/state/methods/#removesideeffect)
   *
   * @internal
   * @param key - Key/Name identifier of the side effect callback to be removed.
   */
  public removeSideEffect(key: string): this {
    delete this.sideEffects[key];
    return this;
  }

  /**
   * Returns a boolean indicating whether a side effect callback with the specified `key`
   * exists in the State or not.
   *
   * [Learn more..](https://agile-ts.org/docs/core/state/methods/#hassideeffect)
   *
   * @internal
   * @param key - Key/Name identifier of the side effect callback to be checked for existence.
   */
  public hasSideEffect(key: string): boolean {
    return !!this.sideEffects[key];
  }
}

export type StateKey = string | number;

export interface StateObserversInterface<ValueType = any> {
  /**
   * Observer responsible for the value of the State.
   */
  value: StateObserver<ValueType>;
}

export interface StateConfigInterface {
  /**
   * Key/Name identifier of the State.
   * @default undefined
   */
  key?: StateKey;
  /**
   * Observers that depend on the State.
   * @default []
   */
  dependents?: Array<Observer>;
  /**
   * Whether the State should be a placeholder
   * and therefore should only exist in the background.
   * @default false
   */
  isPlaceholder?: boolean;
}

export type SideEffectFunctionType<Instance extends State> = (
  instance: Instance,
  properties?: {
    [key: string]: any;
  }
) => void;

export interface SideEffectInterface<Instance extends State> {
  /**
   * Callback function to be called on every State value change.
   * @return () => {}
   */
  callback: SideEffectFunctionType<Instance>;
  /**
   * Weight of the side effect.
   * The weight determines the order of execution of the registered side effects.
   * The higher the weight, the earlier it is executed.
   */
  weight: number;
}

export interface AddSideEffectConfigInterface {
  /**
   * Weight of the side effect.
   * The weight determines the order of execution of the registered side effects.
   * The higher the weight, the earlier it is executed.
   */
  weight?: number;
}
