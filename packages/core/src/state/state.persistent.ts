import {
  Agile,
  defineConfig,
  Persistent,
  State,
  StorageKey,
} from "../internal";

export class StatePersistent<ValueType = any> extends Persistent {
  public state: () => State;

  /**
   * @internal
   * State Persist Manager - Handles permanent storing of State Value
   * @param agileInstance - An instance of Agile
   * @param state - State that gets stored
   * @param key - Key of Storage property
   * @param config - Config
   */
  constructor(
    agileInstance: Agile,
    state: State<ValueType>,
    key?: StorageKey,
    config: StatePersistentConfigInterface = {}
  ) {
    super(agileInstance);
    config = defineConfig(config, {
      instantiate: true,
    });
    this.state = () => state;
    if (config.instantiate)
      this.instantiatePersistent(key).then((success) => {
        state.isPersisted = success;
      });
  }

  public set key(value: StorageKey) {
    this.setKey(value);
  }

  public get key(): StorageKey {
    return this._key;
  }

  //=========================================================================================================
  // Set Key
  //=========================================================================================================
  /**
   * @public
   * Sets Key/Name of Persistent
   * @param value - New Key/Name of Persistent
   */
  public async setKey(value: StorageKey) {
    // If persistent isn't ready try to init it with the new Key
    if (!this.ready) {
      this.instantiatePersistent(value).then((success) => {
        this.state().isPersisted = success;
      });
      return;
    }

    // Check if key has changed
    if (value === this._key) return;

    // Remove value with old Key
    await this.removeValue();

    // Update Key
    this._key = value;

    // Set value with new Key
    await this.updateValue();
  }

  //=========================================================================================================
  // Load Value
  //=========================================================================================================
  /**
   * @internal
   * Loads Value from Storage
   * @return Success?
   */
  public async loadValue(): Promise<boolean> {
    if (!this.ready) return false;
    const loadedValue = await this.agileInstance().storage.get(this._key);
    if (loadedValue) {
      this.state().set(loadedValue, { storage: false });
      return true;
    }
    return false;
  }

  //=========================================================================================================
  // Set Value
  //=========================================================================================================
  /**
   * @internal
   * Saves/Updates Value in Storage
   * @return Success?
   */
  public async updateValue(): Promise<boolean> {
    if (!this.ready) return false;
    this.agileInstance().storage.set(
      this.key,
      this.state().getPersistableValue()
    );
    this.state().isPersisted = true;
    return true;
  }

  //=========================================================================================================
  // Remove Value
  //=========================================================================================================
  /**
   * @internal
   * Removes Value form Storage
   * @return Success?
   */
  public async removeValue(): Promise<boolean> {
    if (!this.ready) return false;
    this.agileInstance().storage.remove(this.key);
    this.state().isPersisted = false;
    return true;
  }

  //=========================================================================================================
  // Validate Key
  //=========================================================================================================
  /**
   * @internal
   * Validates Storage Key
   * @param key - Key that gets validated
   */
  public validateKey(key?: StorageKey): StorageKey | null {
    const state = this.state();

    // Get key from State
    if (!key && state.key) return state.key;

    // Return null if no key found
    if (!key) return null;

    // Set State Key to Storage Key if State has no key
    if (!state.key) state.key = key;

    return key;
  }
}

/**
 * @param instantiate - If Persistent gets instantiated
 */
export interface StatePersistentConfigInterface {
  instantiate?: boolean;
}
