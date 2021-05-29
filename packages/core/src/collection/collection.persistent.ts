import {
  Collection,
  CollectionKey,
  CreatePersistentConfigInterface,
  DefaultItem,
  defineConfig,
  Group,
  GroupKey,
  Item,
  ItemKey,
  LogCodeManager,
  Persistent,
  PersistentKey,
  StorageKey,
} from '../internal';

export class CollectionPersistent<
  DataType extends Object = DefaultItem
> extends Persistent {
  public collection: () => Collection<DataType>;

  static defaultGroupSideEffectKey = 'rebuildGroupStorageValue';
  static storageItemKeyPattern = '_${collectionKey}_item_${itemKey}';
  static storageGroupKeyPattern = '_${collectionKey}_group_${groupKey}';

  /**
   * Internal Class for managing the permanent persistence of a Collection.
   *
   * @internal
   * @param collection - Collection to be persisted.
   * @param config - Configuration object
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

    // Load/Store persisted value/s for the first time
    if (this.ready && config.instantiate) this.initialLoading();
  }

  /**
   * Updates key/name identifier of Persistent.
   *
   * @internal
   * @param value - New key/name identifier.
   */
  public async setKey(value?: StorageKey): Promise<void> {
    const oldKey = this._key;
    const wasReady = this.ready;

    // Assign new key to Persistent
    if (value === this._key) return;
    this._key = value || Persistent.placeHolderKey;

    const isValid = this.validatePersistent();

    // Try to initial load value if persistent wasn't ready before
    if (!wasReady) {
      if (isValid) await this.initialLoading();
      return;
    }

    // Remove persisted values at old key
    await this.removePersistedValue(oldKey);

    // Persist values at the new key
    if (isValid) await this.persistValue(value);
  }

  /**
   * @internal
   * Loads the persisted value into the Collection
   * or persists the Collection value in the corresponding Storage.
   * This depends on whether the Collection has been persisted before.
   */
  public async initialLoading() {
    super.initialLoading().then(() => {
      this.collection().isPersisted = true;
    });
  }

  /**
   * Loads the values of the Collection Instances from the corresponding Storage.
   *
   * @internal
   * @param storageItemKey - Prefix key of persisted Collection Instances | default = Persistent.key |
   * @return Whether the loading was successful.
   */
  public async loadPersistedValue(
    storageItemKey?: PersistentKey
  ): Promise<boolean> {
    if (!this.ready) return false;
    const _storageItemKey = storageItemKey ?? this._key;

    // Check if Collection is already persisted (indicated by the persistence of true at _storageItemKey)
    const isPersisted = await this.agileInstance().storages.get<DataType>(
      _storageItemKey,
      this.config.defaultStorageKey as any
    );

    // Return false if Collection isn't persisted yet
    if (!isPersisted) return false;

    // Helper function to load persisted values into the Collection
    const loadValuesIntoCollection = async () => {
      const defaultGroup = this.collection().getDefaultGroup();
      if (defaultGroup == null) return false;
      const defaultGroupStorageKey = CollectionPersistent.getGroupStorageKey(
        defaultGroup._key,
        _storageItemKey
      );

      // Persist default Group and load its value manually to be 100% sure
      // that it was loaded completely
      defaultGroup.persist(defaultGroupStorageKey, {
        loadValue: false,
        defaultStorageKey: this.config.defaultStorageKey || undefined,
        storageKeys: this.storageKeys,
      });
      if (defaultGroup.persistent?.ready)
        await defaultGroup.persistent.initialLoading();

      // Persist Items found in the default Group's value
      for (const itemKey of defaultGroup._value) {
        const item = this.collection().getItem(itemKey);
        const itemStorageKey = CollectionPersistent.getItemStorageKey(
          itemKey,
          _storageItemKey
        );

        // Persist already existing Item
        if (item != null) {
          item.persist(itemStorageKey, {
            defaultStorageKey: this.config.defaultStorageKey || undefined,
            storageKeys: this.storageKeys,
          });
          continue;
        }

        // Create temporary placeholder Item in which the Item value will be loaded
        const dummyItem = new Item<DataType>(
          this.collection(),
          {
            [this.collection().config.primaryKey]: itemKey, // Setting PrimaryKey of Item to passed itemKey
            dummy: 'item',
          } as any,
          { isPlaceholder: true }
        );

        // Persist dummy Item and load its value manually to be 100% sure
        // that it was loaded completely and exists
        dummyItem?.persist(itemStorageKey, {
          loadValue: false,
          defaultStorageKey: this.config.defaultStorageKey || undefined,
          storageKeys: this.storageKeys,
        });
        if (dummyItem?.persistent?.ready) {
          const success = await dummyItem.persistent.loadPersistedValue(
            itemStorageKey
          );

          // If successfully loaded add Item to Collection
          if (success) this.collection().collectItem(dummyItem);
        }
      }

      return true;
    };
    const success = await loadValuesIntoCollection();

    // Setup Side Effects to keep the Storage value in sync with the State value
    if (success) this.setupSideEffects(storageItemKey);

    return success;
  }

  /**
   * Persists Collection in corresponding Storage if not already done
   * and sets up side effects that dynamically update the storage value when the Collection changes.
   *
   * @internal
   * @param storageItemKey - Prefix key of persisted Collection Instances | default = Persistent.key |
   * @return Whether the persisting and the setting up of the side effects was successful.
   */
  public async persistValue(storageItemKey?: PersistentKey): Promise<boolean> {
    if (!this.ready) return false;
    const _storageItemKey = storageItemKey ?? this._key;
    const defaultGroup = this.collection().getDefaultGroup();
    if (defaultGroup == null) return false;
    const defaultGroupStorageKey = CollectionPersistent.getGroupStorageKey(
      defaultGroup._key,
      _storageItemKey
    );

    // Set flag in Storage to indicate that the Collection is persisted
    this.agileInstance().storages.set(_storageItemKey, true, this.storageKeys);

    // Persist default Group
    defaultGroup.persist(defaultGroupStorageKey, {
      defaultStorageKey: this.config.defaultStorageKey || undefined,
      storageKeys: this.storageKeys,
    });

    // Persist Items found in the default Group's value
    for (const itemKey of defaultGroup._value) {
      const item = this.collection().getItem(itemKey);
      const itemStorageKey = CollectionPersistent.getItemStorageKey(
        itemKey,
        _storageItemKey
      );
      item?.persist(itemStorageKey, {
        defaultStorageKey: this.config.defaultStorageKey || undefined,
        storageKeys: this.storageKeys,
      });
    }

    // Setup Side Effects to keep the Storage value in sync with the Collection value
    this.setupSideEffects(_storageItemKey);

    this.isPersisted = true;
    return true;
  }

  /**
   * Sets up side effects to keep the Storage value in sync with the Collection value
   *
   * @internal
   * @param storageItemKey - Prefix key of persisted Collection Instances | default = Persistent.key |
   */
  public setupSideEffects(storageItemKey?: PersistentKey): void {
    const _storageItemKey = storageItemKey ?? this._key;
    const defaultGroup = this.collection().getDefaultGroup();
    if (defaultGroup == null) return;

    // Add side effect to default Group
    // that adds or removes Items from the Storage based on the Group value
    defaultGroup.addSideEffect(
      CollectionPersistent.defaultGroupSideEffectKey,
      () => this.rebuildStorageSideEffect(defaultGroup, _storageItemKey),
      { weight: 0 }
    );
  }

  /**
   * Removes Collection from the corresponding Storage.
   * -> Collection is no longer persisted
   *
   * @internal
   * @param storageItemKey - Prefix key of persisted Collection Instances | default = Persistent.key |
   * @return Whether the removing was successful.
   */
  public async removePersistedValue(
    storageItemKey?: PersistentKey
  ): Promise<boolean> {
    if (!this.ready) return false;
    const _storageItemKey = storageItemKey ?? this._key;
    const defaultGroup = this.collection().getDefaultGroup();
    if (!defaultGroup) return false;
    const defaultGroupStorageKey = CollectionPersistent.getGroupStorageKey(
      defaultGroup._key,
      _storageItemKey
    );

    // Remove Collection is persisted indicator flag
    this.agileInstance().storages.remove(_storageItemKey, this.storageKeys);

    // Remove default Group from the Storage
    defaultGroup.persistent?.removePersistedValue(defaultGroupStorageKey);
    defaultGroup.removeSideEffect(
      CollectionPersistent.defaultGroupSideEffectKey
    );

    // Remove Items found in the default Group's value from the Storage
    for (const itemKey of defaultGroup._value) {
      const item = this.collection().getItem(itemKey);
      const itemStorageKey = CollectionPersistent.getItemStorageKey(
        itemKey,
        _storageItemKey
      );
      item?.persistent?.removePersistedValue(itemStorageKey);
    }

    this.isPersisted = false;
    return true;
  }

  /**
   * Formats given key so that it can be used as a valid Storage key.
   * If no formatable key is given, an attempt is made to use the Collection key as Storage key.
   * If this also fails, undefined is returned.
   *
   * @internal
   * @param key - Key to be formatted
   */
  public formatKey(key?: StorageKey): StorageKey | undefined {
    if (key == null && this.collection()._key) return this.collection()._key;
    if (key == null) return;
    if (this.collection()._key == null) this.collection()._key = key;
    return key;
  }

  /**
   * Rebuilds Storage depending on Group
   *
   * @internal
   * @param group - Group
   * @param storageItemKey - Prefix key of persisted Collection Instances | default = Persistent.key |
   */
  public rebuildStorageSideEffect(
    group: Group<DataType>,
    storageItemKey?: PersistentKey
  ) {
    const collection = group.collection();
    const _storageItemKey = storageItemKey || collection.persistent?._key;

    // Return if no Item got added or removed
    // because then the Item performs the Storage update itself
    if (group.previousStateValue.length === group._value.length) return;

    // Extract Item keys that got removed or added to the Group
    const addedKeys = group._value.filter(
      (key) => !group.previousStateValue.includes(key)
    );
    const removedKeys = group.previousStateValue.filter(
      (key) => !group._value.includes(key)
    );

    // Persist newly added Items
    addedKeys.forEach((itemKey) => {
      const item = collection.getItem(itemKey);
      const itemStorageKey = CollectionPersistent.getItemStorageKey(
        itemKey,
        _storageItemKey
      );
      if (item != null) {
        if (!item.isPersisted)
          item.persist(itemStorageKey, {
            defaultStorageKey: this.config.defaultStorageKey || undefined,
            storageKeys: this.storageKeys,
          });
        else item.persistent?.persistValue(itemStorageKey);
      }
    });

    // Remove removed Items from the Storage
    removedKeys.forEach((itemKey) => {
      const item = collection.getItem(itemKey);
      const itemStorageKey = CollectionPersistent.getItemStorageKey(
        itemKey,
        _storageItemKey
      );
      if (item != null)
        if (item.isPersisted)
          item.persistent?.removePersistedValue(itemStorageKey);
    });
  }

  /**
   * Builds valid Item Storage key based on the 'Collection Item Persist Pattern'
   *
   * @internal
   * @param itemKey - Key identifier of Item
   * @param collectionKey - Key identifier of Collection
   */
  public static getItemStorageKey(
    itemKey?: ItemKey,
    collectionKey?: CollectionKey
  ): string {
    if (itemKey == null || collectionKey == null)
      LogCodeManager.log('1A:02:00');
    if (itemKey == null) itemKey = 'unknown';
    if (collectionKey == null) collectionKey = 'unknown';
    return this.storageItemKeyPattern
      .replace('${collectionKey}', collectionKey.toString())
      .replace('${itemKey}', itemKey.toString());
  }

  /**
   * Builds valid Item Storage key based on the 'Collection Group Persist Pattern'
   *
   * @internal
   * @param groupKey - Key identifier of Group
   * @param collectionKey - Key identifier of Collection
   */
  public static getGroupStorageKey(
    groupKey?: GroupKey,
    collectionKey?: CollectionKey
  ): string {
    if (groupKey == null || collectionKey == null)
      LogCodeManager.log('1A:02:01');
    if (groupKey == null) groupKey = 'unknown';
    if (collectionKey == null) collectionKey = 'unknown';
    return this.storageGroupKeyPattern
      .replace('${collectionKey}', collectionKey.toString())
      .replace('${groupKey}', groupKey.toString());
  }
}
