import { Agile, StorageKey } from "../internal";

export class Persistent<ValueType = any> {
  public agileInstance: () => Agile;

  public _key: StorageKey = "unknown";
  public ready: boolean = false;

  /**
   * @internal
   * Persistent - Handles saving of Agile Instances
   * @param {Agile} agileInstance - An instance of Agile
   */
  constructor(agileInstance: Agile) {
    this.agileInstance = () => agileInstance;
  }

  public set key(value: StorageKey) {
    this._key = value;
  }

  public get key(): StorageKey {
    return this._key;
  }

  //=========================================================================================================
  // Init Persistent
  //=========================================================================================================
  /**
   * @internal
   * Inits the Persistent - Have to do that this way since validateKey/initialLoading can have deps that aren't set before defining properties in extending/child class
   * @param {StorageKey} key - Key of the Storage property
   */
  public initPersistent(key?: StorageKey): boolean {
    // Validate Key
    const finalKey = this.validateKey(key);
    if (!finalKey) {
      console.error("Agile: No persist Key found!");
      return false;
    }
    this._key = finalKey;

    // Load or Save the persistent Value for the first Time
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
   * Loads or Saves the StorageValue for the first time
   * @param {StorageKey} key -  Key of the Storage property
   */
  public async initialLoading(key: StorageKey) {
    console.warn("Didn't set initialLoading function in Persistent ", this.key);
  }

  //=========================================================================================================
  // Load Value
  //=========================================================================================================
  /**
   * @internal
   * Loads the State Value from the Storage
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
   * Saves/Updates the State Value in the Storage
   * @param {ValueType} value - Value you want to save
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
   * Removes the State Value from the Storage
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
   * Validates the Storage Key
   * @param {StorageKey} key - Key you want to validate
   */
  public validateKey(key?: StorageKey): StorageKey | null {
    console.warn("Didn't set validateKey function in Persistent ", this.key);
    return null;
  }
}
