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
    this.initPersistent(key).then((success) => {
      collection.isPersisted = success;
    });
  }

  public set key(value: StorageKey) {
    // If persistent isn't ready try to init it again
    if (!this.ready) {
      this.initPersistent(value).then((success) => {
        this.collection().isPersisted = success;
      });
      return;
    }

    // Check if key has changed
    if (value === this._key) return;

    // Updates Key in Storage
    const updateKey = async () => {
      // Remove value with old Key
      await this.removeValue();

      // Update Key
      this._key = value;

      // Set value with new Key
      await this.updateValue();
    };

    updateKey();
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
    // Check if Collection is Persisted
    const isPersisted = this.agileInstance().storage.get(this.key);
    if (!isPersisted) return false;

    // Loads Value into Collection
    const loadValueIntoCollection = async () => {
      const primaryKey = this.collection().config.primaryKey || "id";

      // Get Default Group
      const defaultGroup = this.collection().getGroup(
        this.collection().config.defaultGroupKey || "default"
      );

      // Persist Default Group
      defaultGroup.persist(
        this.getItemStorageKey(defaultGroup.key || "default")
      );

      // Load Storage Value of default Group (to be sure it is loaded)
      await defaultGroup.persistent?.loadValue();

      // Load Storage Value from Items
      for (let itemKey of defaultGroup.value) {
        // Get Storage Value
        const storageValue = await this.agileInstance().storage.get(
          this.getItemStorageKey(itemKey)
        );
        if (!storageValue) continue;

        // Collect found Storage Value
        this.collection().collect(storageValue);

        // Persist found Value Item
        this.collection()
          .getItemById(storageValue[primaryKey])
          ?.persist(this.getItemStorageKey(itemKey));
      }
    };

    await loadValueIntoCollection();
    return true;
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
    // Set Collection is Persisted
    this.agileInstance().storage.set(this.key, true);

    // Get default Group
    const defaultGroup = this.collection().getGroup(
      this.collection().config.defaultGroupKey || "default"
    );

    // Persist defaultGroup if it isn't persisted
    if (!defaultGroup.isPersisted)
      defaultGroup.persist(
        this.getItemStorageKey(defaultGroup.key || "default")
      );

    // Persist Collection Items
    for (let itemKey of defaultGroup.value) {
      const itemStorageKey = this.getItemStorageKey(itemKey);
      const item = this.collection().getItemById(itemKey);

      // Persist Item with build ItemStorageKey
      if (!item?.isPersisted) item?.persist(itemStorageKey);
    }

    this.collection().isPersisted = true;
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
    // Set Collection to is not Persisted
    this.agileInstance().storage.remove(this.key);

    // Get default Group
    const defaultGroup = this.collection().getGroup(
      this.collection().config.defaultGroupKey || "default"
    );

    // Remove default Group from Storage
    defaultGroup.persistent?.removeValue();

    // Remove Collection Items from Storage
    for (let itemKey of defaultGroup.value) {
      const item = this.collection().getItemById(itemKey);
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
  public getItemStorageKey(itemKey: ItemKey): string {
    return this.storageItemKeyTemplate
      .replace(
        "${collectionKey}",
        (this.collection().key || "unknown").toString()
      )
      .replace("${itemKey}", itemKey.toString());
  }
}
