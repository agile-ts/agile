import {
  Agile,
  Item,
  Group,
  GroupKey,
  Selector,
  SelectorKey,
  StorageKey,
  GroupConfigInterface,
  defineConfig,
  isValidObject,
  normalizeArray,
  copy,
  CollectionPersistent,
  GroupAddConfig,
  ComputedTracker,
  generateId,
  SideEffectConfigInterface,
} from '../internal';

export class Collection<DataType = DefaultItem> {
  public agileInstance: () => Agile;

  public config: CollectionConfigInterface;
  private initialConfig: CreateCollectionConfigInterface;

  public size = 0; // Amount of Items stored in Collection
  public data: { [key: string]: Item<DataType> } = {}; // Collection Data
  public _key?: CollectionKey;
  public isPersisted = false; // If Collection can be stored in Agile Storage (-> successfully integrated persistent)
  public persistent: CollectionPersistent | undefined; // Manages storing Collection Value into Storage

  public groups: { [key: string]: Group<any> } = {};
  public selectors: { [key: string]: Selector<any> } = {};

  public isInstantiated = false;

  /**
   * @public
   * Collection - Class that holds a List of Objects with key and causes rerender on subscribed Components
   * @param agileInstance - An instance of Agile
   * @param config - Config
   */
  constructor(agileInstance: Agile, config: CollectionConfig<DataType> = {}) {
    this.agileInstance = () => agileInstance;

    // Set temp Config for creating proper Placeholder Items (of Selector)
    this.config = {
      defaultGroupKey: 'default',
      primaryKey: 'id',
    };

    // Assign Properties
    let _config = typeof config === 'function' ? config(this) : config;
    _config = defineConfig(_config, {
      primaryKey: 'id',
      groups: {},
      selectors: {},
      defaultGroupKey: 'default',
    });
    this._key = _config.key;
    this.config = {
      defaultGroupKey: _config.defaultGroupKey as any,
      primaryKey: _config.primaryKey as any,
    };
    this.initialConfig = _config;

    this.initGroups(_config.groups as any);
    this.initSelectors(_config.selectors as any);

    if (_config.initialData) this.collect(_config.initialData);

    this.isInstantiated = true;
  }

  /**
   * @public
   * Set Key/Name of Collection
   */
  public set key(value: CollectionKey | undefined) {
    this.setKey(value);
  }

  /**
   * @public
   * Get Key/Name of Collection
   */
  public get key(): CollectionKey | undefined {
    return this._key;
  }

  //=========================================================================================================
  // Set Key
  //=========================================================================================================
  /**
   * @public
   * Set Key/Name of Collection
   * @param value - New Key/Name of Collection
   */
  public setKey(value: CollectionKey | undefined) {
    const oldKey = this._key;

    // Update State Key
    this._key = value;

    // Update Key in Persistent (only if oldKey equal to persistentKey -> otherwise the PersistentKey got formatted and will be set where other)
    if (value && this.persistent?._key === oldKey)
      this.persistent?.setKey(value);

    return this;
  }

  //=========================================================================================================
  // Group
  //=========================================================================================================
  /**
   * @public
   * Group - Holds Items of this Collection
   * @param initialItems - Initial ItemKeys of Group
   * @param config - Config
   */
  public Group(
    initialItems?: Array<ItemKey>,
    config?: GroupConfigInterface
  ): Group<DataType> {
    if (this.isInstantiated) {
      const key = config?.key || generateId();
      Agile.logger.warn(
        "After the instantiation we recommend using 'MY_COLLECTION.createGroup' instead of 'MY_COLLECTION.Group'"
      );
      if (!config?.key)
        Agile.logger.warn(
          `Failed to find key for creation of Group. Group with random key '${key}' got created!`
        );
      return this.createGroup(key, initialItems);
    }

    return new Group<DataType>(this, initialItems, config);
  }

  //=========================================================================================================
  // Selector
  //=========================================================================================================
  /**
   * @public
   * Selector - Represents an Item of this Collection
   * @param initialKey - Key of Item that the Selector represents
   * @param config - Config
   */
  public Selector(
    initialKey: ItemKey,
    config?: { key?: SelectorKey }
  ): Selector<DataType> {
    if (this.isInstantiated) {
      const key = config?.key || generateId();
      Agile.logger.warn(
        "After the instantiation we recommend using 'MY_COLLECTION.createSelector' instead of 'MY_COLLECTION.Selector'"
      );
      if (!config?.key)
        Agile.logger.warn(
          `Failed to find key for creation of Selector. Selector with random key '${key}' got created!`
        );
      return this.createSelector(key, initialKey);
    }
    return new Selector<DataType>(this, initialKey, config);
  }

  //=========================================================================================================
  // Init Groups
  //=========================================================================================================
  /**
   * @internal
   * Instantiates Groups
   */
  public initGroups(groups: { [key: string]: Group<any> } | string[]) {
    if (!groups) return;
    let groupsObject: { [key: string]: Group<DataType> } = {};

    // If groups is Array of GroupNames transform it to Group Object
    if (Array.isArray(groups)) {
      groups.forEach((groupKey) => {
        groupsObject[groupKey] = new Group<DataType>(this, [], {
          key: groupKey,
        });
      });
    } else groupsObject = groups;

    // Add default Group
    groupsObject[this.config.defaultGroupKey] = new Group<DataType>(this, [], {
      key: this.config.defaultGroupKey,
    });

    // Set Key/Name of Group to property Name
    for (const key in groupsObject)
      if (!groupsObject[key]._key) groupsObject[key].setKey(key);

    this.groups = groupsObject;
  }

  //=========================================================================================================
  // Init Selectors
  //=========================================================================================================
  /**
   * @internal
   * Instantiates Selectors
   */
  public initSelectors(selectors: { [key: string]: Selector<any> } | string[]) {
    if (!selectors) return;
    let selectorsObject: { [key: string]: Selector<DataType> } = {};

    // If selectors is Array of SelectorNames transform it to Selector Object
    if (Array.isArray(selectors)) {
      selectors.forEach((selectorKey) => {
        selectorsObject[selectorKey] = new Selector<DataType>(
          this,
          selectorKey,
          {
            key: selectorKey,
          }
        );
      });
    } else selectorsObject = selectors;

    // Set Key/Name of Selector to property Name
    for (const key in selectorsObject)
      if (!selectorsObject[key]._key) selectorsObject[key].setKey(key);

    this.selectors = selectorsObject;
  }

  //=========================================================================================================
  // Collect
  //=========================================================================================================
  /**
   * @public
   * Collect Item/s
   * @param data - Data that gets added to Collection
   * @param groupKeys - Add collected Item/s to certain Groups
   * @param config - Config
   */
  public collect(
    data: DataType | Array<DataType>,
    groupKeys?: GroupKey | Array<GroupKey>,
    config: CollectConfigInterface<DataType> = {}
  ): this {
    const _data = normalizeArray<DataType>(data);
    const _groupKeys = normalizeArray<GroupKey>(groupKeys);
    const defaultGroupKey = this.config.defaultGroupKey;
    const primaryKey = this.config.primaryKey;
    config = defineConfig<CollectConfigInterface>(config, {
      method: 'push',
      background: false,
      patch: false,
      select: false,
    });

    // Add default GroupKey, because Items get always added to default Group
    if (!_groupKeys.includes(defaultGroupKey)) _groupKeys.push(defaultGroupKey);

    // Create not existing Groups
    _groupKeys.forEach((key) => !this.groups[key] && this.createGroup(key));

    _data.forEach((data, index) => {
      const itemKey = data[primaryKey];

      // Add Item to Collection
      const success = this.setData(data, {
        patch: config.patch,
        background: config.background,
      });
      if (!success) return this;

      // Add ItemKey to provided Groups
      _groupKeys.forEach((groupKey) => {
        this.getGroup(groupKey)?.add(itemKey, {
          method: config.method,
          background: config.background,
        });
      });

      if (config.select) this.createSelector(itemKey, itemKey);
      if (config.forEachItem) config.forEachItem(data, itemKey, index);
    });

    return this;
  }

  //=========================================================================================================
  // Update
  //=========================================================================================================
  /**
   * @public
   * Updates Item at provided Key
   * @param itemKey - ItemKey of Item that gets updated
   * @param changes - Changes that will be merged into the Item (flatMerge)
   * @param config - Config
   */
  public update(
    itemKey: ItemKey,
    changes: DefaultItem | DataType,
    config: UpdateConfigInterface = {}
  ): Item<DataType> | undefined {
    const item = this.getItem(itemKey, { notExisting: true });
    const primaryKey = this.config.primaryKey;
    config = defineConfig(config, {
      addNewProperties: false,
      background: false,
    });

    if (!item) {
      Agile.logger.error(
        `Item with key/name '${itemKey}' doesn't exist in Collection '${this._key}'!`
      );
      return undefined;
    }
    if (!isValidObject(changes)) {
      Agile.logger.error(
        `You have to pass an valid Changes Object to update '${itemKey}' in '${this._key}'!`
      );
      return undefined;
    }

    const oldItemKey = item._value[primaryKey];
    const newItemKey = changes[primaryKey] || oldItemKey;
    const updateItemKey = oldItemKey !== newItemKey;

    // Delete primaryKey from 'changes' because if it has changed, it gets properly updated in 'updateItemKey' (below)
    if (changes[primaryKey]) delete changes[primaryKey];

    // Update ItemKey
    if (updateItemKey)
      this.updateItemKey(oldItemKey, newItemKey, {
        background: config.background,
      });

    // Apply changes to Item
    item.patch(changes as any, {
      background: config.background,
      addNewProperties: config.addNewProperties,
    });

    return item;
  }

  //=========================================================================================================
  // Create Group
  //=========================================================================================================
  /**
   * @public
   * Creates new Group that can hold Items of Collection
   * @param groupKey - Name/Key of Group
   * @param initialItems - Initial ItemKeys of Group
   */
  public createGroup(
    groupKey: GroupKey,
    initialItems: Array<ItemKey> = []
  ): Group<DataType> {
    let group = this.getGroup(groupKey, { notExisting: true });

    if (!this.isInstantiated) {
      Agile.logger.warn(
        "We recommend to use 'MY_COLLECTION.Group' instead of 'MY_COLLECTION.createGroup' in the Collection config!"
      );
    }

    // Check if Group already exists
    if (group) {
      if (!group.isPlaceholder) {
        Agile.logger.warn(`Group with the name '${groupKey}' already exists!`);
        return group;
      }
      group.set(initialItems, { overwrite: true });
      return group;
    }

    // Create Group
    group = new Group<DataType>(this, initialItems, { key: groupKey });
    this.groups[groupKey] = group;

    return group;
  }

  //=========================================================================================================
  // Has Group
  //=========================================================================================================
  /**
   * @public
   * Check if Group exists in Collection
   * @param groupKey - Key/Name of Group
   * @param config - Config
   */
  public hasGroup(
    groupKey: GroupKey | undefined,
    config: HasConfigInterface = {}
  ): boolean {
    return !!this.getGroup(groupKey, config);
  }

  //=========================================================================================================
  // Get Group
  //=========================================================================================================
  /**
   * @public
   * Get Group by Key/Name
   * @param groupKey - Key/Name of Group
   * @param config - Config
   */
  public getGroup(
    groupKey: GroupKey | undefined,
    config: HasConfigInterface = {}
  ): Group<DataType> | undefined {
    config = defineConfig(config, {
      notExisting: false,
    });

    // Get Group
    const group = groupKey ? this.groups[groupKey] : undefined;

    // Check if Group exists
    if (!group || (!config.notExisting && group.isPlaceholder))
      return undefined;

    ComputedTracker.tracked(group.observer);
    return group;
  }

  //=========================================================================================================
  // Get Group With Reference
  //=========================================================================================================
  /**
   * @public
   * Get Group by Key/Name or a Reference to it if it doesn't exist yet
   * @param groupKey - Name/Key of Group
   */
  public getGroupWithReference(groupKey: GroupKey): Group<DataType> {
    let group = this.getGroup(groupKey, { notExisting: true });

    // Create dummy Group to hold reference
    if (!group) {
      group = new Group<DataType>(this, [], {
        key: groupKey,
        isPlaceholder: true,
      });
      this.groups[groupKey] = group;
    }

    ComputedTracker.tracked(group.observer);
    return group;
  }

  //=========================================================================================================
  // Remove Group
  //=========================================================================================================
  /**
   * @public
   * Removes Group by Key/Name
   * @param groupKey - Name/Key of Group
   */
  public removeGroup(groupKey: GroupKey): this {
    if (!this.groups[groupKey]) {
      Agile.logger.warn(`Group with the key/name '${groupKey}' doesn't exist!`);
      return this;
    }
    delete this.groups[groupKey];
    return this;
  }

  //=========================================================================================================
  // Create Selector
  //=========================================================================================================
  /**
   * @public
   * Creates new Selector that represents an Item of the Collection
   * @param selectorKey - Name/Key of Selector
   * @param itemKey - Key of Item which the Selector represents
   */
  public createSelector(
    selectorKey: SelectorKey,
    itemKey: ItemKey
  ): Selector<DataType> {
    let selector = this.getSelector(selectorKey, { notExisting: true });

    if (!this.isInstantiated) {
      Agile.logger.warn(
        "We recommend to use 'MY_COLLECTION.Selector' instead of 'MY_COLLECTION.createSelector' in the Collection config!"
      );
    }

    // Check if Selector already exists
    if (selector) {
      if (!selector.isPlaceholder) {
        Agile.logger.warn(
          `Selector with the name '${selectorKey}' already exists!`
        );
        return selector;
      }
      selector.select(itemKey, { overwrite: true });
      return selector;
    }

    // Create Selector
    selector = new Selector<DataType>(this, itemKey, {
      key: selectorKey,
    });
    this.selectors[selectorKey] = selector;

    return selector;
  }

  //=========================================================================================================
  // Has Selector
  //=========================================================================================================
  /**
   * @public
   * Check if Selector exists in Collection
   * @param selectorKey - Key/Name of Selector
   * @param config - Config
   */
  public hasSelector(
    selectorKey: SelectorKey | undefined,
    config: HasConfigInterface = {}
  ): boolean {
    return !!this.getSelector(selectorKey, config);
  }

  //=========================================================================================================
  // Get Selector
  //=========================================================================================================
  /**
   * @public
   * Get Selector by Key/Name
   * @param selectorKey - Key/Name of Selector
   * @param config - Config
   */
  public getSelector(
    selectorKey: SelectorKey | undefined,
    config: HasConfigInterface = {}
  ): Selector<DataType> | undefined {
    config = defineConfig(config, {
      notExisting: false,
    });

    // Get Selector
    const selector = selectorKey ? this.selectors[selectorKey] : undefined;

    // Check if Selector exists
    if (!selector || (!config.notExisting && selector.isPlaceholder))
      return undefined;

    ComputedTracker.tracked(selector.observer);
    return selector;
  }

  //=========================================================================================================
  // Get Selector With Reference
  //=========================================================================================================
  /**
   * @public
   * Get Selector by Key/Name or a Reference to it if it doesn't exist yet
   * @param selectorKey - Name/Key of Selector
   */
  public getSelectorWithReference(
    selectorKey: SelectorKey
  ): Selector<DataType> {
    let selector = this.getSelector(selectorKey, { notExisting: true });

    // Create dummy Selector to hold reference
    if (!selector) {
      selector = new Selector<DataType>(this, 'unknown', {
        key: selectorKey,
        isPlaceholder: true,
      });
      this.selectors[selectorKey] = selector;
    }

    ComputedTracker.tracked(selector.observer);
    return selector;
  }

  //=========================================================================================================
  // Remove Selector
  //=========================================================================================================
  /**
   * @public
   * Removes Selector by Key/Name
   * @param selectorKey - Name/Key of Selector
   */
  public removeSelector(selectorKey: SelectorKey): this {
    if (!this.selectors[selectorKey]) {
      Agile.logger.warn(
        `Selector with the key/name '${selectorKey}' doesn't exist!`
      );
      return this;
    }
    this.selectors[selectorKey]?.unselect(); // Unselects current selected Item
    delete this.selectors[selectorKey];
    return this;
  }

  //=========================================================================================================
  // Has Item
  //=========================================================================================================
  /**
   * @public
   * Check if Item exists in Collection
   * @param itemKey - Key/Name of Item
   * @param config - Config
   */
  public hasItem(
    itemKey: ItemKey | undefined,
    config: HasConfigInterface = {}
  ): boolean {
    return !!this.getItem(itemKey, config);
  }

  //=========================================================================================================
  // Get Item by Id
  //=========================================================================================================
  /**
   * @public
   * Get Item by Key/Name
   * @param itemKey - ItemKey of Item
   * @param config - Config
   */
  public getItem(
    itemKey: ItemKey | undefined,
    config: HasConfigInterface = {}
  ): Item<DataType> | undefined {
    config = defineConfig(config, {
      notExisting: false,
    });

    // Get Item
    const item = itemKey ? this.data[itemKey] : undefined;

    // Check if Item exists
    if (!item || (!config.notExisting && !item.exists)) return undefined;

    ComputedTracker.tracked(item.observer);
    return item;
  }

  /**
   * @public
   * Get Item by Key/Name or a Reference to it if it doesn't exist yet
   * @param itemKey - Key/Name of Item
   */
  public getItemWithReference(itemKey: ItemKey): Item<DataType> {
    let item = this.getItem(itemKey, { notExisting: true });

    // Create dummy Item to hold reference
    if (!item) {
      item = new Item<DataType>(
        this,
        {
          [this.config.primaryKey]: itemKey, // Setting PrimaryKey of Item to passed itemKey
          dummy: 'item',
        } as any,
        {
          isPlaceholder: true,
        }
      );
      this.data[itemKey] = item;
    }

    ComputedTracker.tracked(item.observer);
    return item;
  }

  //=========================================================================================================
  // Get Value by Id
  //=========================================================================================================
  /**
   * @public
   * Get Value of Item by Key/Name
   * @param itemKey - ItemKey of Item that holds the Value
   * @param config - Config
   */
  public getItemValue(
    itemKey: ItemKey | undefined,
    config: HasConfigInterface = {}
  ): DataType | undefined {
    const item = this.getItem(itemKey, config);
    if (!item) return undefined;
    return item.value;
  }

  //=========================================================================================================
  // Get All Items
  //=========================================================================================================
  /**
   * @public
   * Get all Items of Collection
   * @param config - Config
   */
  public getAllItems(config: HasConfigInterface = {}): Array<Item<DataType>> {
    config = defineConfig(config, {
      notExisting: false,
    });

    // Get Items
    const items: Array<Item<DataType>> = [];
    for (const key in this.data) {
      const item = this.data[key];
      if ((!config.notExisting && item.exists) || config.notExisting) {
        items.push(item);
      }
    }

    return items;
  }

  //=========================================================================================================
  // Get All Item Values
  //=========================================================================================================
  /**
   * @public
   * Get all Values of Items in a Collection
   * @param config - Config
   */
  public getAllItemValues(config: HasConfigInterface = {}): Array<DataType> {
    const items = this.getAllItems(config);
    return items.map((item) => item.value);
  }

  //=========================================================================================================
  // Persist
  //=========================================================================================================
  /**
   * @public
   * Stores Collection Value into Agile Storage permanently
   * @param config - Config
   */
  public persist(config?: CollectionPersistentConfigInterface): this;
  /**
   * @public
   * Stores Collection Value into Agile Storage permanently
   * @param key - Key/Name of created Persistent (Note: Key required if Collection has no set Key!)
   * @param config - Config
   */
  public persist(
    key?: StorageKey,
    config?: CollectionPersistentConfigInterface
  ): this;
  public persist(
    keyOrConfig: StorageKey | CollectionPersistentConfigInterface = {},
    config: CollectionPersistentConfigInterface = {}
  ): this {
    let _config: CollectionPersistentConfigInterface;
    let key: StorageKey | undefined;

    if (isValidObject(keyOrConfig)) {
      _config = keyOrConfig as CollectionPersistentConfigInterface;
      key = this._key;
    } else {
      _config = config || {};
      key = keyOrConfig as StorageKey;
    }

    _config = defineConfig(_config, {
      instantiate: true,
      storageKeys: [],
    });

    if (this.persistent)
      Agile.logger.warn(
        `By persisting the Collection '${this._key}' twice you overwrite the old Persistent Instance!`
      );

    // Create persistent -> Persist Value
    this.persistent = new CollectionPersistent<DataType>(this, {
      instantiate: _config.instantiate,
      storageKeys: _config.storageKeys,
      key: key,
    });

    return this;
  }

  //=========================================================================================================
  // On Load
  //=========================================================================================================
  /**
   * @public
   * Callback Function that gets called if the persisted Value gets loaded into the Collection for the first Time
   * Note: Only useful for persisted Collections!
   * @param callback - Callback Function
   */
  public onLoad(callback: (success: boolean) => void): this {
    if (this.persistent) {
      this.persistent.onLoad = callback;

      // If Collection is already 'isPersisted' the loading was successful -> callback can be called
      if (this.isPersisted) callback(true);
    } else {
      Agile.logger.error(
        `Please make sure you persist the Collection '${this._key}' before using the 'onLoad' function!`
      );
    }
    return this;
  }

  //=========================================================================================================
  // Get Group Count
  //=========================================================================================================
  /**
   * @public
   * Get count of registered Groups in Collection
   */
  public getGroupCount(): number {
    let size = 0;
    for (const group in this.groups) size++;
    return size;
  }

  //=========================================================================================================
  // Get Selector Count
  //=========================================================================================================
  /**
   * @public
   * Get count of registered Selectors in Collection
   */
  public getSelectorCount(): number {
    let size = 0;
    for (const selector in this.selectors) size++;
    return size;
  }

  //=========================================================================================================
  // Reset
  //=========================================================================================================
  /**
   * @public
   * Resets this Collection
   */
  public reset() {
    // Reset Data
    this.data = {};
    this.size = 0;

    // Reset Groups
    for (const key in this.groups) this.getGroup(key)?.reset();

    // Reset Selectors
    for (const key in this.selectors) this.getSelector(key)?.reset();
  }

  //=========================================================================================================
  // Put
  //=========================================================================================================
  /**
   * @public
   * Puts ItemKey/s into Group/s (GroupKey/s)
   * @param itemKeys - ItemKey/s that get added to provided Group/s
   * @param groupKeys - Group/s to which the ItemKey/s get added
   * @param config - Config
   */
  public put(
    itemKeys: ItemKey | Array<ItemKey>,
    groupKeys: GroupKey | Array<GroupKey>,
    config: GroupAddConfig = {}
  ) {
    const _itemKeys = normalizeArray(itemKeys);
    const _groupKeys = normalizeArray(groupKeys);

    // Add ItemKeys to Groups
    _groupKeys.forEach((groupKey) => {
      this.getGroup(groupKey)?.add(_itemKeys, config);
    });
  }

  //=========================================================================================================
  // Update Item Key
  //=========================================================================================================
  /**
   * @internal
   * Updates Key/Name of Item in all Instances (Group, Selector, ..)
   * @param oldItemKey - Old ItemKey
   * @param newItemKey - New ItemKey
   * @param config - Config
   */
  public updateItemKey(
    oldItemKey: ItemKey,
    newItemKey: ItemKey,
    config: UpdateItemKeyConfigInterface = {}
  ): boolean {
    const item = this.getItem(oldItemKey, { notExisting: true });
    config = defineConfig(config, {
      background: false,
    });

    if (!item || oldItemKey === newItemKey) return false;

    // Check if Item with newItemKey already exists
    if (this.hasItem(newItemKey)) {
      Agile.logger.warn(
        `Couldn't update ItemKey from '${oldItemKey}' to '${newItemKey}' because an Item with the key/name '${newItemKey}' already exists!`
      );
      return false;
    }

    // Remove Item from old ItemKey and add Item to new ItemKey
    delete this.data[oldItemKey];
    this.data[newItemKey] = item;

    // Update Key/Name of Item
    item.setKey(newItemKey, {
      background: config.background,
    });

    // Update persist Key of Item (Doesn't get updated by updating key of Item because PersistKey is special formatted)
    item.persistent?.setKey(
      CollectionPersistent.getItemStorageKey(newItemKey, this._key)
    );

    // Update ItemKey in Groups
    for (const groupKey in this.groups) {
      const group = this.getGroup(groupKey, { notExisting: true });
      if (!group || !group.has(oldItemKey)) continue;
      group.replace(oldItemKey, newItemKey, { background: config.background });
    }

    // Update ItemKey in Selectors
    for (const selectorKey in this.selectors) {
      const selector = this.getSelector(selectorKey, { notExisting: true });
      if (!selector) continue;

      // Reselect Item in existing Selector which has selected the newItemKey
      if (selector.hasSelected(newItemKey)) {
        selector.select(newItemKey, {
          force: true, // Because ItemKeys are the same
          background: config.background,
        });
      }

      // Select newItemKey in existing Selector which has selected the oldItemKey
      if (selector.hasSelected(oldItemKey))
        selector.select(newItemKey, {
          background: config?.background,
        });
    }

    return true;
  }

  //=========================================================================================================
  // Get GroupKeys That Have ItemKey
  //=========================================================================================================
  /**
   * @public
   * Gets GroupKeys that contain the passed ItemKey
   * @param itemKey - ItemKey
   */
  public getGroupKeysThatHaveItemKey(itemKey: ItemKey): Array<GroupKey> {
    const groupKeys: Array<GroupKey> = [];
    for (const groupKey in this.groups) {
      const group = this.getGroup(groupKey, { notExisting: true });
      if (group?.has(itemKey)) groupKeys.push(groupKey);
    }
    return groupKeys;
  }

  //=========================================================================================================
  // Remove
  //=========================================================================================================
  /**
   * @public
   * Remove Items from Collection
   * @param itemKeys - ItemKey/s that get removed
   */
  public remove(itemKeys: ItemKey | Array<ItemKey>) {
    return {
      fromGroups: (groups: Array<ItemKey> | ItemKey) =>
        this.removeFromGroups(itemKeys, groups),
      everywhere: () => this.removeItems(itemKeys),
    };
  }

  //=========================================================================================================
  // Remove From Groups
  //=========================================================================================================
  /**
   * @public
   * Removes Item/s from Group/s
   * @param itemKeys - ItemKey/s that get removed from Group/s
   * @param groupKeys - GroupKey/s of Group/s form which the ItemKey/s will be removed
   */
  public removeFromGroups(
    itemKeys: ItemKey | Array<ItemKey>,
    groupKeys: GroupKey | Array<GroupKey>
  ): void {
    const _itemKeys = normalizeArray(itemKeys);
    const _groupKeys = normalizeArray(groupKeys);

    _itemKeys.forEach((itemKey) => {
      let removedFromGroupsCount = 0;

      // Remove ItemKey from Groups
      _groupKeys.forEach((groupKey) => {
        const group = this.getGroup(groupKey, { notExisting: true });
        if (!group || !group.has(itemKey)) return;
        group.remove(itemKey);
        removedFromGroupsCount++;
      });

      // If Item got removed from every Groups the Item was in, remove it completely
      if (
        removedFromGroupsCount >=
        this.getGroupKeysThatHaveItemKey(itemKey).length
      )
        this.removeItems(itemKey);
    });
  }

  //=========================================================================================================
  // Remove Items
  //=========================================================================================================
  /**
   * @public
   * Removes Item completely from Collection
   * @param itemKeys - ItemKey/s of Item/s
   */
  public removeItems(itemKeys: ItemKey | Array<ItemKey>): void {
    const _itemKeys = normalizeArray<ItemKey>(itemKeys);

    _itemKeys.forEach((itemKey) => {
      const item = this.getItem(itemKey, { notExisting: true });
      if (!item) return;

      // Remove Item from Groups
      for (const groupKey in this.groups) {
        const group = this.getGroup(groupKey, { notExisting: true });
        if (group?.has(itemKey)) group?.remove(itemKey);
      }

      // Remove Item from Storage
      item.persistent?.removePersistedValue();

      // Remove Item from Collection
      delete this.data[itemKey];

      // Reselect Item in Selectors (to create new dummyItem that holds reference)
      for (const selectorKey in this.selectors) {
        const selector = this.getSelector(selectorKey, { notExisting: true });
        if (selector?.hasSelected(itemKey))
          selector?.select(itemKey, { force: true });
      }

      this.size--;
    });
  }

  //=========================================================================================================
  // Set Data
  //=========================================================================================================
  /**
   * @internal
   * Updates existing or creates Item from provided Data
   * @param data - Data
   * @param config - Config
   */
  public setData(data: DataType, config: SetDataConfigInterface = {}): boolean {
    const _data = copy(data as any); // Transformed Data to any because of unknown Object (DataType)
    const primaryKey = this.config.primaryKey;
    config = defineConfig(config, {
      patch: false,
      background: false,
    });

    if (!isValidObject(_data)) {
      Agile.logger.error(
        `Item Data of Collection '${this._key}' has to be an valid Object!`
      );
      return false;
    }

    if (!Object.prototype.hasOwnProperty.call(_data, primaryKey)) {
      Agile.logger.error(
        `Collection '${this._key}' Item Data has to contain a primaryKey property called '${this.config.primaryKey}'!`
      );
      return false;
    }

    const itemKey = _data[primaryKey];
    let item = this.getItem(itemKey, { notExisting: true });
    const wasPlaceholder = item?.isPlaceholder || false;
    const createItem = !item;

    // Create or update Item
    if (!createItem && config.patch)
      item?.patch(_data, { background: config.background });
    if (!createItem && !config.patch)
      item?.set(_data, { background: config.background });
    if (createItem) {
      // Create and assign Item to Collection
      item = new Item<DataType>(this, _data);
      this.data[itemKey] = item;

      // Rebuild Groups That include ItemKey after assigning Item to Collection (otherwise it can't find Item)
      this.rebuildGroupsThatIncludeItemKey(itemKey, {
        background: config.background,
      });
    }

    // Increase size of Collection
    if (createItem || wasPlaceholder) this.size++;

    return true;
  }

  //=========================================================================================================
  // Rebuild Groups That Includes Item Key
  //=========================================================================================================
  /**
   * @internal
   * Rebuilds Groups that include the provided ItemKey
   * @itemKey - Item Key
   * @config - Config
   */
  public rebuildGroupsThatIncludeItemKey(
    itemKey: ItemKey,
    config: RebuildGroupsThatIncludeItemKeyConfigInterface = {}
  ): void {
    config = defineConfig(config, {
      background: false,
      sideEffects: {
        enabled: true,
        exclude: [],
      },
    });

    // Rebuild Groups that include ItemKey
    for (const groupKey in this.groups) {
      const group = this.getGroup(groupKey);
      if (group?.has(itemKey)) {
        // group.rebuild(); Not necessary because a sideEffect of the Group is to rebuild it self
        group?.ingest({
          background: config?.background,
          force: true, // because Group value doesn't change only the output changes
          sideEffects: config?.sideEffects,
          storage: false, // because Group only rebuilds and doesn't change its value
        });
      }
    }
  }
}

export type DefaultItem = { [key: string]: any };
export type CollectionKey = string | number;
export type ItemKey = string | number;

/**
 * @param key - Key/Name of Collection
 * @param groups - Groups of Collection
 * @param selectors - Selectors of Collection
 * @param primaryKey - Name of Property that holds the PrimaryKey (default = id)
 * @param defaultGroupKey - Key/Name of Default Group that holds all collected Items
 * @param initialData - Initial Data of Collection
 */
export interface CreateCollectionConfigInterface<DataType = DefaultItem> {
  groups?: { [key: string]: Group<any> } | string[];
  selectors?: { [key: string]: Selector<any> } | string[];
  key?: CollectionKey;
  primaryKey?: string;
  defaultGroupKey?: GroupKey;
  initialData?: Array<DataType>;
}

/**
 * @param primaryKey - Name of Property that holds the PrimaryKey (default = id)
 * @param defaultGroupKey - Key/Name of Default Group that holds all collected Items
 */
export interface CollectionConfigInterface {
  primaryKey: string;
  defaultGroupKey: ItemKey;
}

/**
 * @param patch - If Item gets patched into existing Item with the same Id
 * @param method - Way of adding Item to Collection (push, unshift)
 * @param forEachItem - Gets called for each Item that got collected
 * @param background - If collecting an Item happens in the background (-> not causing any rerender)
 * @param select - If collected Items get selected with a Selector
 */
export interface CollectConfigInterface<DataType = any> {
  patch?: boolean;
  method?: 'push' | 'unshift';
  forEachItem?: (data: DataType, key: ItemKey, index: number) => void;
  background?: boolean;
  select?: boolean;
}

/**
 * @param addNewProperties - If properties that doesn't exist in base ItemData get added
 * @param background - If updating an Item happens in the background (-> not causing any rerender)
 */
export interface UpdateConfigInterface {
  addNewProperties?: boolean;
  background?: boolean;
}

/**
 * @param background - If updating the primaryKey of an Item happens in the background (-> not causing any rerender)
 */
export interface UpdateItemKeyConfigInterface {
  background?: boolean;
}

/**
 * @param background - If assigning a new value happens in the background (-> not causing any rerender)
 * @param force - Force creating and performing Job
 * @param sideEffects - If Side Effects of Group gets executed
 */
export interface RebuildGroupsThatIncludeItemKeyConfigInterface {
  background?: boolean;
  force?: boolean;
  sideEffects?: SideEffectConfigInterface;
}

/**
 * @param notExisting - If placeholder can be found
 */
export interface HasConfigInterface {
  notExisting?: boolean;
}

/**
 * @param instantiate - If Persistent gets instantiated
 * @param storageKeys - Key/Name of Storages which gets used to persist the Collection Value (NOTE: If not passed the default Storage will be used)
 */
export interface CollectionPersistentConfigInterface {
  instantiate?: boolean;
  storageKeys?: StorageKey[];
}

/**
 * @param patch - If Data gets patched into existing Item
 * @param background - If assigning Data happens in background
 */
export interface SetDataConfigInterface {
  patch?: boolean;
  background?: boolean;
}

export type CollectionConfig<DataType = DefaultItem> =
  | CreateCollectionConfigInterface<DataType>
  | ((
      collection: Collection<DataType>
    ) => CreateCollectionConfigInterface<DataType>);
