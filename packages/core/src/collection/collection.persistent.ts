import {
  Agile,
  Collection,
  GroupKey,
  ItemKey,
  Persistent,
  StorageKey,
} from "../internal";

export class CollectionPersistent<DataType = any> extends Persistent {
  public collection: () => Collection;
  public storageItemKeyTemplate = "_${collectionKey}_item_${itemKey}";
  private defaultGroupSideEffectKey = "rebuildStorage";

  /**
   * @internal
   * Collection Persist Manager - Handles permanent storing of Collection Value
   * @param agileInstance - An instance of Agile
   * @param collection - Collection that gets stored
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
      this.initPersistent(value).then((success) => {
        this.collection().isPersisted = success;
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

    // Check if Collection is Persisted
    const isPersisted = this.agileInstance().storage.get(this.key);
    if (!isPersisted) return false;

    // Load Values into Collection
    const loadValuesIntoCollection = async () => {
      const primaryKey = this.collection().config.primaryKey || "id";

      // Get Default Group
      const defaultGroup = this.collection().getGroup(
        this.collection().config.defaultGroupKey || "default"
      );

      // Persist Default Group
      defaultGroup.persist(this.getStorageKey(defaultGroup.key || "default"));

      // Load Storage Value of default Group (to be sure it is loaded)
      await defaultGroup.persistent?.loadValue();

      // Load Storage Value from Items
      for (let itemKey of defaultGroup.value) {
        // Get Storage Value
        const storageValue = await this.agileInstance().storage.get(
          this.getStorageKey(itemKey)
        );
        if (!storageValue) continue;

        // Collect found Storage Value
        this.collection().collect(storageValue);

        // Persist found Value Item
        this.collection()
          .getItemById(storageValue[primaryKey])
          ?.persist(this.getStorageKey(itemKey));
      }
    };

    await loadValuesIntoCollection();
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
    if (!this.ready) return false;

    // Set Collection to Persisted
    if (!this.collection().isPersisted)
      this.agileInstance().storage.set(this.key, true);

    // Get default Group
    const defaultGroup = this.collection().getGroup(
      this.collection().config.defaultGroupKey || "default"
    );

    // Persist default Group
    defaultGroup.persist(this.getStorageKey(defaultGroup.key || "default"));

    // Add sideEffect to default Group which adds and removes Items from the Storage depending on the Group Value
    if (!defaultGroup.hasSideEffect(this.defaultGroupSideEffectKey))
      defaultGroup.addSideEffect(this.defaultGroupSideEffectKey, () => {
        const addedKeys = defaultGroup.value.filter(
          (key) => !defaultGroup.previousStateValue.includes(key)
        );
        const removedKeys = defaultGroup.previousStateValue.filter(
          (key) => !defaultGroup.value.includes(key)
        );

        // Persist Added Keys
        addedKeys.forEach((itemKey) => {
          const item = this.collection().getItemById(itemKey);
          const itemStorageKey = this.getStorageKey(itemKey);
          if (!item?.isPersisted) item?.persist(itemStorageKey);
        });

        // Unpersist removed Keys
        removedKeys.forEach((itemKey) => {
          const item = this.collection().getItemById(itemKey);
          item?.persistent?.removeValue();
        });
      });

    // Persist Collection Items
    for (let itemKey of defaultGroup.value) {
      const item = this.collection().getItemById(itemKey);
      const itemStorageKey = this.getStorageKey(itemKey);
      item?.persist(itemStorageKey);
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
    if (!this.ready) return false;

    // Set Collection to not Persisted
    this.agileInstance().storage.remove(this.key);

    // Get default Group
    const defaultGroup = this.collection().getGroup(
      this.collection().config.defaultGroupKey || "default"
    );

    // Remove default Group from Storage
    defaultGroup.persistent?.removeValue();

    // Remove sideEffect from default Group
    defaultGroup.removeSideEffect(this.defaultGroupSideEffectKey);

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

    // Set Storage Key to Collection Key if Collection has no key
    if (!collection.key) collection.key = key;

    return key;
  }

  //=========================================================================================================
  // Get Item Storage Key
  //=========================================================================================================
  /**
   * @internal
   * Builds StorageKey for Items, Groups of this Collection
   * @param key - Key
   */
  public getStorageKey(key: ItemKey | GroupKey): string {
    return this.storageItemKeyTemplate
      .replace(
        "${collectionKey}",
        (this.collection().key || "unknown").toString()
      )
      .replace("${itemKey}", key.toString());
  }
}
