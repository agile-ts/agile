import { Agile, StorageKey } from "../internal";

export class Persistent<ValueType = any> {
  public agileInstance: () => Agile;

  public _key: StorageKey = "unknown";
  public ready: boolean = false;

  /**
   * @internal
   * Persistent - Handles storing of Agile Instances
   * @param agileInstance - An instance of Agile
   */
  constructor(agileInstance: Agile) {
    this.agileInstance = () => agileInstance;
  }

  /**
   * @internal
   * Set Key/Name of Persistent
   */
  public set key(value: StorageKey) {
    this._key = value;
  }

  /**
   * @internal
   * Get Key/Name of Persistent
   */
  public get key(): StorageKey {
    return this._key;
  }

  //=========================================================================================================
  // Init Persistent
  //=========================================================================================================
  /**
   * @internal
   * Inits Persistent (this class)
   * -> Sometimes this class needs to be instantiated after some properties have been set in extended class
   * @param key - Key of Storage property
   */
  public initPersistent(key?: StorageKey): boolean {
    // Validate Key
    const finalKey = this.validateKey(key);
    if (!finalKey) {
      console.error("Agile: No persist Key found!");
      return false;
    }
    this._key = finalKey;

    // Load/Save persisted Value for the first Time
    this.initialLoading(finalKey);

    this.agileInstance().storage.persistentInstances.add(this);
    this.ready = true;

    return true;
  }

  //=========================================================================================================
  // Initial Loading
  //=========================================================================================================
  /**
   * @internal
   * Loads/Saves Storage Value for the first Time
   * @param key -  Key of Storage property
   */
  public async initialLoading(key: StorageKey) {
    console.warn(
      "Agile: Didn't set initialLoading function in Persistent ",
      this.key
    );
  }

  //=========================================================================================================
  // Load Value
  //=========================================================================================================
  /**
   * @internal
   * Loads Value from Storage at this._key
   */
  public async loadValue(): Promise<ValueType | undefined> {
    if (!this.ready) return;
    return this.agileInstance().storage.get(this._key);
  }

  //=========================================================================================================
  // Set Value
  //=========================================================================================================
  /**
   * @internal
   * Saves/Updates Value in Storage at this._key
   * @param value - new Value that gets set
   */
  public setValue(value: ValueType): void {
    if (!this.ready) return;
    return this.agileInstance().storage.set(this._key, value);
  }

  //=========================================================================================================
  // Remove Value
  //=========================================================================================================
  /**
   * @internal
   * Removes Value form Storage at this._key
   */
  public removeValue(): void {
    if (!this.ready) return;
    return this.agileInstance().storage.remove(this._key);
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
    console.warn(
      "Agile: Didn't set validateKey function in Persistent ",
      this.key
    );
    return null;
  }
}
