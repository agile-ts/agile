import {
  Agile,
  Collection,
  CollectionKey,
  defineConfig,
  Group,
  GroupKey,
  ItemKey,
  Persistent,
  StorageKey,
} from "../internal";

export class CollectionPersistent<DataType = any> extends Persistent {
  public collection: () => Collection<DataType>;
  private defaultGroupSideEffectKey = "rebuildStorage";

  public static storageItemKeyPattern = "_${collectionKey}_item_${itemKey}";
  public static storageGroupKeyPattern = "_${collectionKey}_group_${groupKey}";

  /**
   * @internal
   * Collection Persist Manager - Handles permanent storing of Collection Value
   * @param collection - Collection that gets stored
   * @param key - Key of Storage property
   * @param config - Config
   */
  constructor(
    collection: Collection<DataType>,
    key?: StorageKey,
    config: CollectionPersistentConfigInterface = {}
  ) {
    super(collection.agileInstance());
    config = defineConfig(config, {
      instantiate: true,
    });
    this.collection = () => collection;
    this.storageKeys = config.storageKeys;
    if (config?.instantiate)
      this.instantiatePersistent(key).then((success) => {
        collection.isPersisted = success;
      });
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
    const isPersisted = await this.agileInstance().storages.get(
      this.key,
      this.storageKeys && this.storageKeys[0]
    );
    if (!isPersisted) return false;

    // Load Values into Collection
    const loadValuesIntoCollection = async () => {
      const primaryKey = this.collection().config.primaryKey;

      // Get Default Group
      const defaultGroup = this.collection().getGroup(
        this.collection().config.defaultGroupKey
      );
      if (!defaultGroup) return false;

      // Persist Default Group and instantiate it manually to await its instantiation
      const groupStorageKey = CollectionPersistent.getGroupStorageKey(
        defaultGroup.key,
        this.collection().key
      );
      defaultGroup.persist(groupStorageKey, { instantiate: false });
      defaultGroup.isPersisted =
        (await defaultGroup.persistent?.instantiatePersistent(
          groupStorageKey
        )) || false;

      // Add sideEffect to default Group which adds and removes Items from the Storage depending on the Group Value
      if (!defaultGroup.hasSideEffect(this.defaultGroupSideEffectKey))
        defaultGroup.addSideEffect(this.defaultGroupSideEffectKey, () =>
          this.rebuildStorageSideEffect(defaultGroup)
        );

      // Load Storage Value from Items
      for (let itemKey of defaultGroup.value) {
        // Get Storage Value
        const storageValue = await this.agileInstance().storages.get(
          CollectionPersistent.getItemStorageKey(
            itemKey,
            this.collection().key
          ),
          this.storageKeys && this.storageKeys[0]
        );
        if (!storageValue) continue;

        // Collect found Storage Value
        this.collection().collect(storageValue);

        // Persist found Item that got created out of the Storage Value
        this.collection()
          .getItem(storageValue[primaryKey])
          ?.persist(
            CollectionPersistent.getItemStorageKey(
              itemKey,
              this.collection().key
            )
          );
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

    // Set Collection to Persisted (in Storage)
    this.agileInstance().storages.set(this.key, true, this.storageKeys);

    // Get default Group
    const defaultGroup = this.collection().getGroup(
      this.collection().config.defaultGroupKey
    );
    if (!defaultGroup) return false;

    // Persist default Group
    defaultGroup.persist({ followCollectionPattern: true });

    // Add sideEffect to default Group which adds and removes Items from the Storage depending on the Group Value
    if (!defaultGroup.hasSideEffect(this.defaultGroupSideEffectKey))
      defaultGroup.addSideEffect(this.defaultGroupSideEffectKey, () =>
        this.rebuildStorageSideEffect(defaultGroup)
      );

    // Persist Collection Items
    for (let itemKey of defaultGroup.value) {
      const item = this.collection().getItem(itemKey);
      const itemStorageKey = CollectionPersistent.getItemStorageKey(
        itemKey,
        this.collection().key
      );
      item?.persist(itemStorageKey);
    }

    this.isPersisted = true;
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
    this.agileInstance().storages.remove(this.key, this.storageKeys);

    // Get default Group
    const defaultGroup = this.collection().getGroup(
      this.collection().config.defaultGroupKey
    );
    if (!defaultGroup) return false;

    // Remove default Group from Storage
    defaultGroup.persistent?.removeValue();

    // Remove sideEffect from default Group
    defaultGroup.removeSideEffect(this.defaultGroupSideEffectKey);

    // Remove Collection Items from Storage
    for (let itemKey of defaultGroup.value) {
      const item = this.collection().getItem(itemKey);
      item?.persistent?.removeValue();
    }

    this.isPersisted = false;
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
  // Rebuild Storage SideEffect
  //=========================================================================================================
  /**
   * @internal
   * Rebuilds Storage depending on Group
   * @param group - Group
   */
  private rebuildStorageSideEffect(group: Group<DataType>) {
    const collection = group.collection();

    // Return if only an ItemKey got updated -> length stayed the same
    if (group.previousStateValue.length === group.value.length) return;

    const addedKeys = group.value.filter(
      (key) => !group.previousStateValue.includes(key)
    );
    const removedKeys = group.previousStateValue.filter(
      (key) => !group.value.includes(key)
    );

    // Persist Added Keys
    addedKeys.forEach((itemKey) => {
      const item = collection.getItem(itemKey);
      if (!item?.isPersisted)
        item?.persist(
          CollectionPersistent.getItemStorageKey(itemKey, collection.key)
        );
    });

    // Unpersist removed Keys
    removedKeys.forEach((itemKey) => {
      const item = collection.getItem(itemKey);
      if (item?.isPersisted) item?.persistent?.removeValue();
    });
  }

  //=========================================================================================================
  // Get Item Storage Key
  //=========================================================================================================
  /**
   * @internal
   * Build Item StorageKey with Collection Persist Pattern
   * @param itemKey - Key of Item
   * @param collectionKey - Key of Collection
   */
  public static getItemStorageKey(
    itemKey?: ItemKey,
    collectionKey?: CollectionKey
  ): string {
    if (!itemKey) {
      Agile.logger.error("Failed to build Item StorageKey");
      itemKey = "unknown";
    }
    if (!collectionKey) {
      Agile.logger.error("Failed to build Item StorageKey");
      collectionKey = "unknown";
    }
    return this.storageItemKeyPattern
      .replace("${collectionKey}", collectionKey.toString())
      .replace("${itemKey}", itemKey.toString());
  }

  //=========================================================================================================
  // Get Group Storage Key
  //=========================================================================================================
  /**
   * @internal
   * Build Group StorageKey with Collection Persist Pattern
   * @param groupKey - Key of Group
   * @param collectionKey - Key of Collection
   */
  public static getGroupStorageKey(
    groupKey?: GroupKey,
    collectionKey?: CollectionKey
  ): string {
    if (!groupKey) {
      Agile.logger.error("Failed to build Group StorageKey");
      groupKey = "unknown";
    }
    if (!collectionKey) {
      Agile.logger.error("Failed to build Group StorageKey");
      collectionKey = "unknown";
    }
    return this.storageGroupKeyPattern
      .replace("${collectionKey}", collectionKey.toString())
      .replace("${groupKey}", groupKey.toString());
  }
}

/**
 * @param instantiate - If Persistent gets instantiated
 * @param storageKeys - Key/Name of Storages which gets used to persist the Collection Value (NOTE: If not passed the default Storage will be used)
 */
export interface CollectionPersistentConfigInterface {
  instantiate?: boolean;
  storageKeys?: StorageKey[];
}
