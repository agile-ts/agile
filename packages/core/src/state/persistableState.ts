import {
  defineConfig,
  isFunction,
  isValidObject,
  LogCodeManager,
  PersistentKey,
  State,
  StateKey,
  StatePersistent,
  StatePersistentConfigInterface,
} from '../internal';

export class PersistableState<ValueType = any> extends State<ValueType> {
  // Whether the State is persisted in an external Storage
  public isPersisted = false;
  // Manages the permanent persistent in external Storages
  public persistent: StatePersistent | undefined;

  public setKey(value: StateKey | undefined): this {
    const oldKey = this._key;

    super.setKey(value);

    // Update key in Persistent (only if oldKey is equal to persistentKey
    // because otherwise the persistentKey is detached from the State key
    // -> not managed by State anymore)
    if (value != null && this.persistent?._key === oldKey)
      this.persistent?.setKey(value);

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
  public persist(config?: StatePersistentConfigInterface): this;
  /**
   * Preserves the State `value` in the corresponding external Storage.
   *
   * The specified key is used as the unique identifier for the Persistent.
   *
   * [Learn more..](https://agile-ts.org/docs/core/state/methods/#persist)
   *
   * @public
   * @param key - Key/Name identifier of Persistent.
   * @param config - Configuration object
   */
  public persist(
    key?: PersistentKey,
    config?: StatePersistentConfigInterface
  ): this;
  public persist(
    keyOrConfig: PersistentKey | StatePersistentConfigInterface = {},
    config: StatePersistentConfigInterface = {}
  ): this {
    let _config: StatePersistentConfigInterface;
    let key: PersistentKey | undefined;

    if (isValidObject(keyOrConfig)) {
      _config = keyOrConfig as StatePersistentConfigInterface;
      key = this._key;
    } else {
      _config = config || {};
      key = keyOrConfig as PersistentKey;
    }

    _config = defineConfig(_config, {
      loadValue: true,
      storageKeys: [],
      defaultStorageKey: null as any,
    });

    // Check if State is already persisted
    if (this.persistent != null && this.isPersisted) return this;

    // Create Persistent (-> persist value)
    this.persistent = new StatePersistent<ValueType>(this, {
      instantiate: _config.loadValue,
      storageKeys: _config.storageKeys,
      key: key,
      defaultStorageKey: _config.defaultStorageKey,
    });

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
      LogCodeManager.log('00:03:01', ['OnLoad Callback', 'function']);
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
