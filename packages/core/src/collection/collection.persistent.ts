import {
  Agile,
  Collection,
  ItemKey,
  Persistent,
  StorageKey,
} from "../internal";

export class CollectionPersistent<DataType = any> extends Persistent {
  public collection: () => Collection;
  public storageItemKeyTemplate = "_${collectionKey}_item_${itemKey}";

  /**
   * @internal
   * Collection Persist Manager - Handles permanent saving of Collection Value
   * @param agileInstance - An instance of Agile
   * @param collection - Collection
   * @param key - Key of Storage property
   */
  constructor(
    agileInstance: Agile,
    collection: Collection<DataType>,
    key?: StorageKey
  ) {
    super(agileInstance);
    this.collection = () => collection;
    if (this.initPersistent(key)) collection.isPersisted = true;
  }

  public set key(value: StorageKey) {
    // If persistent isn't ready try to init it again
    if (!this.ready) {
      this.initPersistent(value);
      return;
    }

    // Check if key has changed
    if (value === this._key) return;

    // Remove value with old Key
    this.removeValue();

    // Update Key
    this._key = value;

    // Set value with new Key
    this.updateValue();
  }

  public get key(): StorageKey {
    return this._key;
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
    let isComplete = true; // If Collection is completely stored in Storage

    // Get Default Group
    const defaultGroup = this.collection().getGroup(
      this.collection().config.defaultGroupKey || "default"
    );

    // Load Storage Value of default Group
    await defaultGroup.persistent?.loadValue();
    if (defaultGroup.value.length === 0) isComplete = false;

    // Load Storage Value from Items
    for (let itemKey of defaultGroup.value) {
      const itemStorageKey = this.getItemStorageKey(itemKey);

      // Get Storage Value
      const storageValue = await this.agileInstance().storage.get(
        itemStorageKey
      );
      if (!storageValue) {
        isComplete = false;
        continue;
      }

      // Collect found Storage Value
      this.collection().collect(storageValue);
    }

    return isComplete;
  }

  //=========================================================================================================
  // Set Value
  //=========================================================================================================
  /**
   * @internal
   * Saves/Updates Value in Storage
   * @return Success?
   */
  public updateValue(): boolean {
    // Get default Group
    const defaultGroup = this.collection().getGroup(
      this.collection().config.defaultGroupKey || "default"
    );

    // Persist defaultGroup if it isn't persisted
    if (!defaultGroup.isPersisted) defaultGroup.persist();

    // Persist Collection Items
    for (let itemKey of defaultGroup.value) {
      const itemStorageKey = this.getItemStorageKey(itemKey);
      const item = this.collection().getItemById(itemKey);

      // Persist Item with build ItemStorageKey
      item?.persist(itemStorageKey);
    }

    return false;
  }

  //=========================================================================================================
  // Remove Value
  //=========================================================================================================
  /**
   * @internal
   * Removes Value form Storage
   * @return Success?
   */
  public removeValue(): boolean {
    // Get default Group
    const defaultGroup = this.collection().getGroup(
      this.collection().config.defaultGroupKey || "default"
    );

    // Remove default Group
    defaultGroup.persistent?.removeValue();

    // Remove Collection Items
    for (let itemKey of defaultGroup.value) {
      const itemStorageKey = this.getItemStorageKey(itemKey);
      const item = this.collection().getItemById(itemKey);

      // Persist Item with build ItemStorageKey
      item?.persistent?.removeValue();
    }

    this.collection().isPersisted = false;
    return false;
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
    const collection = this.collection();

    // Get key from Collection
    if (!key && collection.key) return collection.key;

    // Return null if no key found
    if (!key) return null;

    // Set Collection Key to Storage Key if State key isn't set
    if (!collection.key) collection.key = key;

    return key;
  }

  //=========================================================================================================
  // Get Item Storage Key
  //=========================================================================================================
  /**
   * @internal
   * Builds ItemStorageKey out of provided ItemKey
   * @param itemKey - Item Key
   */
  private getItemStorageKey(itemKey: ItemKey): string {
    return this.storageItemKeyTemplate
      .replace(
        "${collectionKey}",
        (this.collection().key || "unknown").toString()
      )
      .replace("${itemKey}", itemKey.toString());
  }
}
