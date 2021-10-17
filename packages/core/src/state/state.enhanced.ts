import {
  defineConfig,
  equal,
  flatMerge,
  generateId,
  isFunction,
  isValidObject,
  notEqual,
} from '@agile-ts/utils';
import { logCodeManager } from '../logCodeManager';
import { State, StateConfigInterface, StateKey } from './state';
import { Agile } from '../agile';
import { StateIngestConfigInterface } from './state.observer';
import {
  CreateStatePersistentConfigInterface,
  StatePersistent,
} from './state.persistent';
import { PersistentKey, StorageKey } from '../storages';

export class EnhancedState<ValueType = any> extends State<ValueType> {
  // Whether the State is persisted in an external Storage
  public isPersisted = false;
  // Manages the permanent persistent in external Storages
  public persistent: StatePersistent | undefined;

  // Method for dynamically computing the State value
  public computeValueMethod?: ComputeValueMethod<ValueType>;
  // Method for dynamically computing the existence of the State
  public computeExistsMethod: ComputeExistsMethod<ValueType>;

  // When an interval is active, the 'intervalId' to clear the interval is temporary stored here
  public currentInterval?: NodeJS.Timer | number;

  /**
   * An enhanced State manages, like a normal State, a piece of Information
   * that we need to remember globally at a later point in time.
   * While providing a toolkit to use and mutate this piece of Information.
   *
   * The main difference to a normal State is however
   * that an enhanced State provides a wider variety of inbuilt utilities (like a persist, undo, watch functionality)
   * but requires a larger bundle size in return.
   *
   * You can create as many global enhanced States as you need.
   *
   * [Learn more..](https://agile-ts.org/docs/core/agile-instance/methods#createstate)
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
    super(agileInstance, initialValue, config);
    this.computeExistsMethod = (v) => {
      return v != null;
    };
  }

  public setKey(value: StateKey | undefined): this {
    const oldKey = this._key;

    // Update State key
    super.setKey(value);

    // Update key in Persistent (only if oldKey is equal to persistentKey
    // because otherwise the persistentKey is detached from the State key
    // -> not managed by State anymore)
    if (value != null && this.persistent?._key === oldKey)
      this.persistent?.setKey(value);

    return this;
  }

  /**
   * Undoes the latest State value change.
   *
   * [Learn more..](https://agile-ts.org/docs/core/state/methods/#undo)
   *
   * @public
   * @param config - Configuration object
   */
  public undo(config: StateIngestConfigInterface = {}): this {
    this.set(this.previousStateValue, config);
    return this;
  }

  /**
   * Resets the State value to its initial value.
   *
   * [Learn more..](https://agile-ts.org/docs/core/state/methods/#reset)
   *
   * @public
   * @param config - Configuration object
   */
  public reset(config: StateIngestConfigInterface = {}): this {
    this.set(this.initialStateValue, config);
    return this;
  }

  /**
   * Merges the specified `targetWithChanges` object into the current State value.
   * This merge can differ for different value combinations:
   * - If the current State value is an `object`, it does a partial update for the object.
   * - If the current State value is an `array` and the specified argument is an array too,
   *   it concatenates the current State value with the value of the argument.
   * - If the current State value is neither an `object` nor an `array`, the patch can't be performed.
   *
   * [Learn more..](https://agile-ts.org/docs/core/state/methods/#patch)
   *
   * @public
   * @param targetWithChanges - Object to be merged into the current State value.
   * @param config - Configuration object
   */
  public patch(
    targetWithChanges: Object,
    config: PatchConfigInterface = {}
  ): this {
    config = defineConfig(config, {
      addNewProperties: true,
    });

    // Check if the given conditions are suitable for a patch action
    if (!isValidObject(this.nextStateValue, true)) {
      logCodeManager.log('14:03:02');
      return this;
    }
    if (!isValidObject(targetWithChanges, true)) {
      logCodeManager.log('00:03:01', {
        replacers: ['TargetWithChanges', 'object'],
      });
      return this;
    }

    // Merge targetWithChanges object into the nextStateValue
    if (
      Array.isArray(targetWithChanges) &&
      Array.isArray(this.nextStateValue)
    ) {
      this.nextStateValue = [
        ...this.nextStateValue,
        ...targetWithChanges,
      ] as any;
    } else {
      this.nextStateValue = flatMerge<ValueType>(
        this.nextStateValue,
        targetWithChanges,
        { addNewProperties: config.addNewProperties }
      );
    }

    // Ingest updated 'nextStateValue' into runtime
    this.ingest(config);

    return this;
  }

  /**
   * Fires on each State value change.
   *
   * Returns the key/name identifier of the created watcher callback.
   *
   * [Learn more..](https://agile-ts.org/docs/core/state/methods/#watch)
   *
   * @public
   * @param callback - A function to be executed on each State value change.
   */
  public watch(callback: StateWatcherCallback<ValueType>): string;
  /**
   * Fires on each State value change.
   *
   * [Learn more..](https://agile-ts.org/docs/core/state/methods/#watch)
   *
   * @public
   * @param key - Key/Name identifier of the watcher callback.
   * @param callback - A function to be executed on each State value change.
   */
  public watch(key: string, callback: StateWatcherCallback<ValueType>): this;
  public watch(
    keyOrCallback: string | StateWatcherCallback<ValueType>,
    callback?: StateWatcherCallback<ValueType>
  ): this | string {
    const generateKey = isFunction(keyOrCallback);
    let _callback: StateWatcherCallback<ValueType>;
    let key: string;

    if (generateKey) {
      key = generateId();
      _callback = keyOrCallback as StateWatcherCallback<ValueType>;
    } else {
      key = keyOrCallback as string;
      _callback = callback as StateWatcherCallback<ValueType>;
    }

    if (!isFunction(_callback)) {
      logCodeManager.log('00:03:01', {
        replacers: ['Watcher Callback', 'function'],
      });
      return this;
    }

    this.addSideEffect(
      key,
      (instance) => {
        _callback(instance.value, key);
      },
      { weight: 0 }
    );
    return generateKey ? key : this;
  }

  /**
   * Removes a watcher callback with the specified key/name identifier from the State.
   *
   * [Learn more..](https://agile-ts.org/docs/core/state/methods/#removewatcher)
   *
   * @public
   * @param key - Key/Name identifier of the watcher callback to be removed.
   */
  public removeWatcher(key: string): this {
    this.removeSideEffect(key);
    return this;
  }

  /**
   * Fires on the initial State value assignment and then destroys itself.
   *
   * [Learn more..](https://agile-ts.org/docs/core/state/methods/#oninaugurated)
   *
   * @public
   * @param callback - A function to be executed after the first State value assignment.
   */
  public onInaugurated(callback: StateWatcherCallback<ValueType>): this {
    const watcherKey = 'InauguratedWatcherKey';
    this.watch(watcherKey, (value, key) => {
      callback(value, key);
      this.removeSideEffect(watcherKey);
    });
    return this;
  }

  /**
   * Repeatedly calls the specified callback function,
   * with a fixed time delay between each call.
   *
   * [Learn more..](https://agile-ts.org/docs/core/state/methods/#interval)
   *
   * @public
   * @param handler - A function to be executed every delay milliseconds.
   * @param delay - The time, in milliseconds (thousandths of a second),
   * the timer should delay in between executions of the specified function.
   */
  public interval(
    handler: (value: ValueType) => ValueType,
    delay?: number
  ): this {
    if (!isFunction(handler)) {
      logCodeManager.log('00:03:01', {
        replacers: ['Interval Callback', 'function'],
      });
      return this;
    }
    if (this.currentInterval) {
      logCodeManager.log('14:03:03', { replacers: [] }, this.currentInterval);
      return this;
    }
    this.currentInterval = setInterval(() => {
      this.set(handler(this._value));
    }, delay ?? 1000);
    return this;
  }

  /**
   * Cancels a active timed, repeating action
   * which was previously established by a call to `interval()`.
   *
   * [Learn more..](https://agile-ts.org/docs/core/state/methods/#clearinterval)
   *
   * @public
   */
  public clearInterval(): void {
    if (this.currentInterval) {
      clearInterval(this.currentInterval as number);
      delete this.currentInterval;
    }
  }

  /**
   * Returns a boolean indicating whether the State exists.
   *
   * It calculates the value based on the `computeExistsMethod()`
   * and whether the State is a placeholder.
   *
   * [Learn more..](https://agile-ts.org/docs/core/state/methods/#exists)
   *
   * @public
   */
  public get exists(): boolean {
    return !this.isPlaceholder && this.computeExistsMethod(this.value);
  }

  /**
   * Defines the method used to compute the existence of the State.
   *
   * It is retrieved on each `exists()` method call
   * to determine whether the State exists or not.
   *
   * [Learn more..](https://agile-ts.org/docs/core/state/methods/#computeexists)
   *
   * @public
   * @param method - Method to compute the existence of the State.
   */
  public computeExists(method: ComputeExistsMethod<ValueType>): this {
    if (!isFunction(method)) {
      logCodeManager.log('00:03:01', {
        replacers: ['Compute Exists Method', 'function'],
      });
      return this;
    }
    this.computeExistsMethod = method;
    return this;
  }

  /**
   * Defines the method used to compute the value of the State.
   *
   * It is retrieved on each State value change,
   * in order to compute the new State value
   * based on the specified compute method.
   *
   * [Learn more..](https://agile-ts.org/docs/core/state/methods/#computevalue)
   *
   * @public
   * @param method - Method to compute the value of the State.
   */
  public computeValue(method: ComputeValueMethod<ValueType>): this {
    if (!isFunction(method)) {
      logCodeManager.log('00:03:01', {
        replacers: ['Compute Value Method', 'function'],
      });
      return this;
    }
    this.computeValueMethod = method;

    // Initial compute
    // (not directly computing it here since it is computed once in the runtime!)
    this.set(this.nextStateValue);

    return this;
  }

  /**
   * Returns a boolean indicating whether the specified value is equal to the current State value.
   *
   * Equivalent to `===` with the difference that it looks at the value
   * and not on the reference in the case of objects.
   *
   * @public
   * @param value - Value to be compared with the current State value.
   */
  public is(value: ValueType): boolean {
    return equal(value, this.value);
  }

  /**
   * Returns a boolean indicating whether the specified value is not equal to the current State value.
   *
   * Equivalent to `!==` with the difference that it looks at the value
   * and not on the reference in the case of objects.
   *
   * @public
   * @param value - Value to be compared with the current State value.
   */
  public isNot(value: ValueType): boolean {
    return notEqual(value, this.value);
  }

  /**
   * Inverts the current State value.
   *
   * Some examples are:
   * - `'jeff'` -> `'ffej'`
   * - `true` -> `false`
   * - `[1, 2, 3]` -> `[3, 2, 1]`
   * - `10` -> `-10`
   *
   * @public
   */
  public invert(): this {
    switch (typeof this.nextStateValue) {
      case 'boolean':
        this.set(!this.nextStateValue as any);
        break;
      case 'object':
        if (Array.isArray(this.nextStateValue))
          this.set(this.nextStateValue.reverse() as any);
        break;
      case 'string':
        this.set(this.nextStateValue.split('').reverse().join('') as any);
        break;
      case 'number':
        this.set((this.nextStateValue * -1) as any);
        break;
      default:
        logCodeManager.log('14:03:04', {
          replacers: [typeof this.nextStateValue],
        });
    }
    return this;
  }

  /**
   * Preserves the State `value` in the corresponding external Storage.
   *
   * The State key/name is used as the unique identifier for the Persistent.
   * If that is not desired or the State has no unique identifier,
   * please specify a separate unique identifier for the Persistent.
   *
   * [Learn more..](https://agile-ts.org/docs/core/state/methods/#persist)
   *
   * @public
   * @param config - Configuration object
   */
  public persist(config: CreateStatePersistentConfigInterface = {}): this {
    config = defineConfig(config, {
      key: this._key,
    });

    // Check if State is already persisted
    if (this.persistent != null && this.isPersisted) return this;

    // Create Persistent (-> persist value)
    this.persistent = new StatePersistent<ValueType>(this, config);

    return this;
  }

  /**
   * Fires immediately after the persisted `value`
   * is loaded into the State from a corresponding external Storage.
   *
   * Registering such callback function makes only sense
   * when the State is [persisted](https://agile-ts.org/docs/core/state/methods/#persist).
   *
   * [Learn more..](https://agile-ts.org/docs/core/state/methods/#onload)
   *
   * @public
   * @param callback - A function to be executed after the externally persisted `value` was loaded into the State.
   */
  public onLoad(callback: (success: boolean) => void): this {
    if (!this.persistent) return this;
    if (!isFunction(callback)) {
      logCodeManager.log('00:03:01', {
        replacers: ['OnLoad Callback', 'function'],
      });
      return this;
    }

    // Register specified callback
    this.persistent.onLoad = callback;

    // If State is already persisted ('isPersisted') fire specified callback immediately
    if (this.isPersisted) callback(true);

    return this;
  }

  /**
   * Returns the persistable value of the State.
   *
   * @internal
   */
  public getPersistableValue(): any {
    return this._value;
  }
}

export interface PatchConfigInterface
  extends StateIngestConfigInterface,
    PatchOptionConfigInterface {}

export interface PatchOptionConfigInterface {
  /**
   * Whether to add new properties to the object during the merge.
   * @default true
   */
  addNewProperties?: boolean;
}

export type StateWatcherCallback<T = any> = (value: T, key: string) => void;
export type ComputeValueMethod<T = any> = (value: T) => T;
export type ComputeExistsMethod<T = any> = (value: T) => boolean;
