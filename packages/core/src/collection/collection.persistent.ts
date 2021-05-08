import {
  Agile,
  Collection,
  CollectionKey,
  CreatePersistentConfigInterface,
  DefaultItem,
  defineConfig,
  Group,
  GroupKey,
  ItemKey,
  Persistent,
  PersistentKey,
  StorageKey,
} from '../internal';

export class CollectionPersistent<
  DataType extends object = DefaultItem
> extends Persistent {
  public collection: () => Collection<DataType>;

  static defaultGroupSideEffectKey = 'rebuildGroupStorageValue';
  static storageItemKeyPattern = '_${collectionKey}_item_${itemKey}';
  static storageGroupKeyPattern = '_${collectionKey}_group_${groupKey}';

  /**
   * @internal
   * Collection Persist Manager - Handles permanent storing of Collection Value
   * @param collection - Collection that gets stored
   * @param config - Config
   */
  constructor(
    collection: Collection<DataType>,
    config: CreatePersistentConfigInterface = {}
  ) {
    super(collection.agileInstance(), {
      instantiate: false,
    });
    config = defineConfig(config, {
      instantiate: true,
      storageKeys: [],
      defaultStorageKey: null,
    });
    this.collection = () => collection;
    this.instantiatePersistent({
      key: config.key,
      storageKeys: config.storageKeys,
      defaultStorageKey: config.defaultStorageKey,
    });

    // Load/Store persisted Value/s for the first Time
    if (this.ready && config.instantiate) this.initialLoading();
  }

  //=========================================================================================================
  // Set Key
  //=========================================================================================================
  /**
   * @internal
   * Updates Key/Name of Persistent
   * @param value - New Key/Name of Persistent
   */
  public async setKey(value?: StorageKey): Promise<void> {
    const oldKey = this._key;
    const wasReady = this.ready;

    // Assign Key
    if (value === this._key) return;
    this._key = value || Persistent.placeHolderKey;

    const isValid = this.validatePersistent();

    // Try to Initial Load Value if persistent wasn't ready
    if (!wasReady) {
      if (isValid) await this.initialLoading();
      return;
    }

    // Remove value at old Key
    await this.removePersistedValue(oldKey);

    // Assign Value to new Key
    if (isValid) await this.persistValue(value);
  }

  //=========================================================================================================
  // Initial Loading
  //=========================================================================================================
  /**
   * @internal
   * Loads/Saves Storage Value for the first Time
   */
  public async initialLoading() {
    super.initialLoading().then(() => {
      this.collection().isPersisted = true;
    });
  }

  //=========================================================================================================
  // Load Persisted Value
  //=========================================================================================================
  /**
   * @internal
   * Loads Collection from Storage
   * @param storageKey - Prefix Key of Persisted Instances (default PersistentKey)
   * @return Success?
   */
  public async loadPersistedValue(
    storageKey?: PersistentKey
  ): Promise<boolean> {
    if (!this.ready) return false;
    const _storageKey = storageKey || this._key;

    // Check if Collection is Persisted
    const isPersisted = await this.agileInstance().storages.get<DataType>(
      _storageKey,
      this.config.defaultStorageKey as any
    );
    if (!isPersisted) return false;

    // Loads Values into Collection
    const loadValuesIntoCollection = async () => {
      const defaultGroup = this.collection().getGroup(
        this.collection().config.defaultGroupKey
      );
      if (!defaultGroup) return false;

      // Persist Default Group and load its Value manually to be 100% sure it got loaded
      defaultGroup.persist({
        loadValue: false,
        followCollectionPersistKeyPattern: true,
      });
      if (defaultGroup.persistent?.ready) {
        await defaultGroup.persistent?.initialLoading();
        defaultGroup.isPersisted = true;
      }

      // Load Items into Collection
      for (const itemKey of defaultGroup._value) {
        const itemStorageKey = CollectionPersistent.getItemStorageKey(
          itemKey,
          _storageKey
        );

        // Get Storage Value
        const storageValue = await this.agileInstance().storages.get<DataType>(
          itemStorageKey,
          this.config.defaultStorageKey as any
        );
        if (!storageValue) continue;

        // Collect found Storage Value
        this.collection().collect(storageValue);
      }
      return true;
    };
    const success = await loadValuesIntoCollection();

    // Persist Collection, so that the Storage Value updates dynamically if the Collection updates
    if (success) await this.persistValue(_storageKey);

    return success;
  }

  //=========================================================================================================
  // Persist Value
  //=========================================================================================================
  /**
   * @internal
   * Sets everything up so that the Collection gets saved in the Storage
   * @param storageKey - Prefix Key of Persisted Instances (default PersistentKey)
   * @return Success?
   */
  public async persistValue(storageKey?: PersistentKey): Promise<boolean> {
    if (!this.ready) return false;
    const _storageKey = storageKey || this._key;
    const defaultGroup = this.collection().getGroup(
      this.collection().config.defaultGroupKey
    );
    if (!defaultGroup) return false;

    // Set Collection to Persisted (in Storage)
    this.agileInstance().storages.set(_storageKey, true, this.storageKeys);

    // Persist default Group
    if (!defaultGroup.isPersisted)
      defaultGroup.persist({ followCollectionPersistKeyPattern: true });

    // Add sideEffect to default Group which adds and removes Items from the Storage depending on the Group Value
    defaultGroup.addSideEffect(
      CollectionPersistent.defaultGroupSideEffectKey,
      () => this.rebuildStorageSideEffect(defaultGroup, _storageKey),
      { weight: 0 }
    );

    // Persist Collection Items
    for (const itemKey of defaultGroup._value) {
      const item = this.collection().getItem(itemKey);
      const itemStorageKey = CollectionPersistent.getItemStorageKey(
        itemKey,
        _storageKey
      );
      item?.persist(itemStorageKey);
    }

    this.isPersisted = true;
    return true;
  }

  //=========================================================================================================
  // Remove Persisted Value
  //=========================================================================================================
  /**
   * @internal
   * Removes Collection from the Storage
   * @param storageKey - Prefix Key of Persisted Instances (default PersistentKey)
   * @return Success?
   */
  public async removePersistedValue(
    storageKey?: PersistentKey
  ): Promise<boolean> {
    if (!this.ready) return false;
    const _storageKey = storageKey || this._key;
    const defaultGroup = this.collection().getGroup(
      this.collection().config.defaultGroupKey
    );
    if (!defaultGroup) return false;

    // Set Collection to not Persisted
    this.agileInstance().storages.remove(_storageKey, this.storageKeys);

    // Remove default Group from Storage
    defaultGroup.persistent?.removePersistedValue();

    // Remove Rebuild Storage sideEffect from default Group
    defaultGroup.removeSideEffect(
      CollectionPersistent.defaultGroupSideEffectKey
    );

    // Remove Collection Items from Storage
    for (const itemKey of defaultGroup._value) {
      const item = this.collection().getItem(itemKey);
      item?.persistent?.removePersistedValue();
    }

    this.isPersisted = false;
    return true;
  }

  //=========================================================================================================
  // Format Key
  //=========================================================================================================
  /**
   * @internal
   * Formats Storage Key
   * @param key - Key that gets formatted
   */
  public formatKey(key?: StorageKey): StorageKey | undefined {
    const collection = this.collection();

    // Get key from Collection
    if (!key && collection._key) return collection._key;

    if (!key) return;

    // Set Storage Key to Collection Key if Collection has no key
    if (!collection._key) collection._key = key;

    return key;
  }

  //=========================================================================================================
  // Rebuild Storage SideEffect
  //=========================================================================================================
  /**
   * @internal
   * Rebuilds Storage depending on Group
   * @param group - Group
   * @param key - Prefix Key of Persisted Instances (default PersistentKey)
   */
  public rebuildStorageSideEffect(group: Group<DataType>, key?: PersistentKey) {
    const collection = group.collection();
    const _key = key || collection.persistent?._key;

    // Return if only a ItemKey got updated
    if (group.previousStateValue.length === group._value.length) return;

    const addedKeys = group._value.filter(
      (key) => !group.previousStateValue.includes(key)
    );
    const removedKeys = group.previousStateValue.filter(
      (key) => !group._value.includes(key)
    );

    // Persist Added Keys
    addedKeys.forEach((itemKey) => {
      const item = collection.getItem(itemKey);
      const _itemKey = CollectionPersistent.getItemStorageKey(itemKey, _key);
      if (!item) return;
      if (!item.isPersisted) item.persist(_itemKey);
      else item.persistent?.persistValue(_itemKey);
    });

    // Unpersist removed Keys
    removedKeys.forEach((itemKey) => {
      const item = collection.getItem(itemKey);
      const _itemKey = CollectionPersistent.getItemStorageKey(itemKey, _key);
      if (!item) return;
      if (item.isPersisted) item.persistent?.removePersistedValue(_itemKey);
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
    if (!itemKey || !collectionKey)
      Agile.logger.warn('Failed to build unique Item StorageKey!');
    if (!itemKey) itemKey = 'unknown';
    if (!collectionKey) collectionKey = 'unknown';
    return this.storageItemKeyPattern
      .replace('${collectionKey}', collectionKey.toString())
      .replace('${itemKey}', itemKey.toString());
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
    if (!groupKey || !collectionKey)
      Agile.logger.warn('Failed to build unique Group StorageKey!');
    if (!groupKey) groupKey = 'unknown';
    if (!collectionKey) collectionKey = 'unknown';

    return this.storageGroupKeyPattern
      .replace('${collectionKey}', collectionKey.toString())
      .replace('${groupKey}', groupKey.toString());
  }
}
