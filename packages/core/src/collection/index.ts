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
  flatMerge,
  isValidObject,
  normalizeArray,
  copy,
  CollectionPersistent,
  GroupAddConfig,
} from "../internal";

export class Collection<DataType = DefaultItem> {
  public agileInstance: () => Agile;

  public config: CollectionConfigInterface;
  private initialConfig: CreateCollectionConfigInterface;

  public size: number = 0; // Amount of Items stored in Collection
  public data: { [key: string]: Item<DataType> } = {}; // Collection Data
  public _key?: CollectionKey;
  public isPersisted: boolean = false; // If Collection can be stored in Agile Storage (-> successfully integrated persistent)
  public persistent: CollectionPersistent | undefined; // Manages storing Collection Value into Storage

  public groups: { [key: string]: Group<any> } = {};
  public selectors: { [key: string]: Selector<any> } = {};

  /**
   * @public
   * Class that holds a List of Objects with key and causes rerender on subscribed Components
   * @param agileInstance - An instance of Agile
   * @param config - Config
   */
  constructor(agileInstance: Agile, config: CollectionConfig<DataType> = {}) {
    this.agileInstance = () => agileInstance;

    // Set temp Config for creating proper Placeholder Items (of Selector)
    this.config = {
      defaultGroupKey: "default",
      primaryKey: "id",
    };

    // Assign Properties
    let _config = typeof config === "function" ? config(this) : config;
    _config = defineConfig(_config, {
      primaryKey: "id",
      groups: {},
      selectors: {},
      defaultGroupKey: "default",
    });
    this._key = _config.key;
    this.config = {
      defaultGroupKey: _config.defaultGroupKey as any,
      primaryKey: _config.primaryKey as any,
    };
    this.initialConfig = _config;

    this.initGroups(_config.groups as any);
    this.initSelectors(_config.selectors as any);
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

    // Update Collection Key
    this._key = value;

    // Update Key in PersistManager
    if (
      value !== undefined &&
      this.persistent &&
      this.persistent.key === oldKey
    )
      this.persistent.key = value;
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
    return new Selector<DataType>(this, initialKey, config);
  }

  //=========================================================================================================
  // Init Groups
  //=========================================================================================================
  /**
   * @internal
   * Instantiates Groups
   */
  private initGroups(groups: { [key: string]: Group<any> } | string[]) {
    if (!groups) return;
    let groupsObject: { [key: string]: Group<DataType> } = {};

    // If groups is Array of SelectorNames transform it to Selector Object
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
    for (let key in groupsObject)
      if (!groupsObject[key].key) groupsObject[key].key = key;

    this.groups = groupsObject;
  }

  //=========================================================================================================
  // Init Selectors
  //=========================================================================================================
  /**
   * @internal
   * Instantiates Selectors
   */
  private initSelectors(
    selectors: { [key: string]: Selector<any> } | string[]
  ) {
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
    for (let key in selectorsObject)
      if (!selectorsObject[key].key) selectorsObject[key].key = key;

    this.selectors = selectorsObject;
  }

  //=========================================================================================================
  // Collect
  //=========================================================================================================
  /**
   * @public
   * Collect Item/s
   * @param items - Item/s that get collected and added to this Collection
   * @param groups - Add collected Item/s to certain Groups
   * @param config - Config
   */
  public collect(
    items: DataType | Array<DataType>,
    groups?: GroupKey | Array<GroupKey>,
    config: CollectConfigInterface<DataType> = {}
  ): this {
    const _items = normalizeArray<DataType>(items);
    const groupKeys = normalizeArray<GroupKey>(groups);
    const defaultGroupKey = this.config.defaultGroupKey;
    const primaryKey = this.config.primaryKey;
    config = defineConfig<CollectConfigInterface>(config, {
      method: "push",
      background: false,
      patch: false,
    });

    // Add default GroupKey, because Items get always added to default Group
    if (!groupKeys.includes(defaultGroupKey)) groupKeys.push(defaultGroupKey);

    // Create not existing Groups
    groupKeys.forEach(
      (groupName) => !this.groups[groupName] && this.createGroup(groupName)
    );

    // Instantiate Items
    _items.forEach((data, index) => {
      const itemKey = data[primaryKey];
      const itemExistsInCollection = !!this.data[itemKey];

      // Add Item to Collection
      const success = this.setData(data, {
        patch: config.patch,
        background: config.background,
      });
      if (!success) return this;

      // Ingest Groups that include the ItemKey into Runtime, which than rebuilds the Group (because output of group changed)
      if (!itemExistsInCollection) {
        for (let groupKey in this.groups) {
          const group = this.getGroup(groupKey);
          if (group && group.value.includes(itemKey)) {
            group.ingest({
              force: true,
              background: config.background,
              storage: false,
            });
          }
        }
      }

      // Add ItemKey to provided Groups
      groupKeys.forEach((groupKey) => {
        this.groups[groupKey].add(itemKey, {
          method: config.method,
          background: config.background,
        });
      });

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
    if (!this.data.hasOwnProperty(itemKey)) {
      console.error(
        `Agile: ItemKey '${itemKey}' doesn't exist in Collection!`,
        this
      );
      return undefined;
    }
    if (!isValidObject(changes)) {
      console.error(`Agile: Changes have to be an Object!`, this);
      return undefined;
    }

    const item = this.data[itemKey];
    const primaryKey = this.config.primaryKey;
    config = defineConfig(config, {
      addNewProperties: true,
      background: false,
    });

    // Merge changes into ItemValue
    const newItemValue = flatMerge(copy(item.nextStateValue), changes, {
      addNewProperties: config.addNewProperties,
    });

    const oldItemKey = item.value[primaryKey];
    const newItemKey = newItemValue[primaryKey];
    const updateItemKey = oldItemKey !== newItemKey;

    // Apply changes to Item
    item.set(newItemValue, {
      background: config.background,
      storage: !updateItemKey, // depends if the ItemKey got updated since it would get overwritten if the ItemKey/StorageKey gets updated anyway
    });

    // Update ItemKey of Item
    if (updateItemKey)
      this.updateItemKey(oldItemKey, newItemKey, {
        background: config.background,
      });

    return this.data[newItemValue[primaryKey]];
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
    initialItems?: Array<ItemKey>
  ): Group<DataType> {
    let group = this.getGroup(groupKey);

    // Create or update Group
    if (group) {
      if (!group.isPlaceholder) return group;
      group.set(initialItems || []);
      group.isPlaceholder = false;
    } else {
      group = new Group<DataType>(this, initialItems, { key: groupKey });
      this.groups[groupKey] = group;
    }

    if (this.groups.hasOwnProperty(groupKey)) {
      console.warn(`Agile: Group with the name '${groupKey}' already exists!`);
      return this.groups[groupKey];
    }

    return group;
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
    let selector = this.getSelector(selectorKey);

    // Create or update Selector
    if (selector) {
      if (!selector.isPlaceholder) return selector;
      selector.select(itemKey);
      selector.isPlaceholder = false;
    } else {
      selector = new Selector<DataType>(this, itemKey, {
        key: selectorKey,
      });
      this.selectors[selectorKey] = selector;
    }

    return selector;
  }

  //=========================================================================================================
  // Get Group
  //=========================================================================================================
  /**
   * @public
   * Get Group by Key/Name
   * @param groupKey - Name/Key of Group
   * @param config - Config
   */
  public getGroup(
    groupKey: GroupKey | undefined,
    config: GetGroupConfigInterface = {}
  ): Group<DataType> | undefined {
    config = defineConfig(config, {
      notExisting: false,
    });

    // Get Group
    const group = groupKey ? this.groups[groupKey] : undefined;

    // Check if Group exists
    if (!group || (!config.notExisting && group.isPlaceholder))
      return undefined;

    // Add State to tracked Observers (for auto tracking used observers in computed function)
    if (this.agileInstance().runtime.trackObservers)
      this.agileInstance().runtime.trackedObservers.add(group.observer);

    return group;
  }

  //=========================================================================================================
  // Get Group With Reference
  //=========================================================================================================
  /**
   * @public
   * Get Group by Key/Name or a Reference to it if it doesn't exist
   * If Group doesn't exist, it returns a reference of the Group that will be filled with the real data later
   * @param groupKey - Name/Key of Group
   */
  public getGroupWithReference(
    groupKey: GroupKey | undefined
  ): Group<DataType> {
    let group = groupKey ? this.groups[groupKey] : undefined;

    // Create dummy Group to hold reference
    if (!group) {
      const dummyGroup = new Group<DataType>(this, [], {
        key: groupKey,
      });
      dummyGroup.isPlaceholder = true;
      this.groups[groupKey || "unknown"] = dummyGroup;
      return dummyGroup;
    }

    // Add State to tracked Observers (for auto tracking used observers in computed function)
    if (this.agileInstance().runtime.trackObservers)
      this.agileInstance().runtime.trackedObservers.add(group.observer);

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
      console.warn(
        `Agile: Group with the key/name '${groupKey}' doesn't exist!`
      );
      return this;
    }
    delete this.groups[groupKey];
    return this;
  }

  //=========================================================================================================
  // Get Selector
  //=========================================================================================================
  /**
   * @public
   * Get Selector by Key/Name
   * @param selectorKey - Name/Key of Selector
   * @param config - Config
   */
  public getSelector(
    selectorKey: SelectorKey | undefined,
    config: GetSelectorConfigInterface = {}
  ): Selector<DataType> | undefined {
    config = defineConfig(config, {
      notExisting: false,
    });

    // Get Selector
    const selector = selectorKey ? this.selectors[selectorKey] : undefined;

    // Check if Selector exists
    if (!selector || (!config.notExisting && selector.isPlaceholder))
      return undefined;

    // Add State to tracked Observers (for auto tracking used observers in computed function)
    if (this.agileInstance().runtime.trackObservers)
      this.agileInstance().runtime.trackedObservers.add(selector.observer);

    return selector;
  }

  //=========================================================================================================
  // Get Selector With Reference
  //=========================================================================================================
  /**
   * @public
   * Get Selector by Key/Name or a Reference to it if it doesn't exist
   * If Selector doesn't exist, it returns a reference of the Selector that will be filled with the real data later
   * @param selectorKey - Name/Key of Selector
   */
  public getSelectorWithReference(
    selectorKey: SelectorKey | undefined
  ): Selector<DataType> {
    let selector = selectorKey ? this.selectors[selectorKey] : undefined;

    // Create dummy Group to hold reference
    if (!selector) {
      const dummySelector = new Selector<DataType>(this, "unknown", {
        key: selectorKey,
      });
      dummySelector.isPlaceholder = true;
      this.selectors[selectorKey || "unknown"] = dummySelector;
      return dummySelector;
    }

    // Add State to tracked Observers (for auto tracking used observers in computed function)
    if (this.agileInstance().runtime.trackObservers)
      this.agileInstance().runtime.trackedObservers.add(selector.observer);

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
      console.warn(
        `Agile: Selector with the key/name '${selectorKey}' doesn't exist!`
      );
      return this;
    }
    delete this.selectors[selectorKey];
    return this;
  }

  //=========================================================================================================
  // Remove
  //=========================================================================================================
  /**
   * @public
   * Remove Items from Group or from everywhere
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
    config: GetItemConfigInterface = {}
  ): Item<DataType> | undefined {
    config = defineConfig(config, {
      notExisting: false,
    });

    // Get Item
    const item = itemKey ? this.data[itemKey] : undefined;

    // Check if Item exists
    if (!item || (!config.notExisting && !item.exists)) return undefined;

    // Add State to tracked Observers (for auto tracking used observers in computed function)
    if (this.agileInstance().runtime.trackObservers)
      this.agileInstance().runtime.trackedObservers.add(item.observer);

    return item;
  }

  /**
   * @public
   * Get Item by Key/Name or a Reference to it if it doesn't exist
   * If Item doesn't exist, it returns a reference of the Item that will be filled with the real data later
   * @param itemKey - Name/Key of Item
   */
  public getItemWithReference(itemKey: ItemKey | undefined): Item<DataType> {
    let item = itemKey ? this.data[itemKey] : undefined;

    // Create dummy Item to hold reference
    if (!item) {
      const dummyItem = new Item<DataType>(this, {
        [this.config.primaryKey]: itemKey,
        dummy: true,
      } as any);
      dummyItem.isPlaceholder = true;
      this.data[itemKey || "unknown"] = dummyItem;
      return dummyItem;
    }

    // Add State to tracked Observers (for auto tracking used observers in computed function)
    if (this.agileInstance().runtime.trackObservers)
      this.agileInstance().runtime.trackedObservers.add(item.observer);

    return item;
  }

  //=========================================================================================================
  // Get Value by Id
  //=========================================================================================================
  /**
   * @public
   * Get Value of Item by Key/Name
   * @param itemKey - ItemKey of Item that holds the Value
   */
  public getItemValue(itemKey: ItemKey | undefined): DataType | undefined {
    let item = this.getItem(itemKey);
    if (!item) return undefined;
    return item.value;
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
   * @param key - Storage Key (Note: not needed if Collection has key/name)
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
      key = undefined;
    } else {
      _config = config || {};
      key = keyOrConfig as StorageKey;
    }

    _config = defineConfig(_config, {
      instantiate: true,
    });

    if (this.persistent) {
      Agile.logger.warn(
        "By persisting a Collection twice you overwrite the old Persistent Instance!"
      );
    }

    // Create persistent -> Persist Value
    this.persistent = new CollectionPersistent<DataType>(this, {
      instantiate: _config.instantiate,
      storageKeys: _config.storageKeys,
      key: key,
    });

    return this;
  }

  //=========================================================================================================
  // Group Size
  //=========================================================================================================
  /**
   * @public
   * Get count of registered Groups in Collection
   */
  public getGroupCount(): number {
    let size = 0;
    for (let group in this.groups) size++;
    return size;
  }

  //=========================================================================================================
  // Selector Size
  //=========================================================================================================
  /**
   * @public
   * Get count of registered Selectors in Collection
   */
  public getSelectorCount(): number {
    let size = 0;
    for (let selector in this.selectors) size++;
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
    // Remove Items from Storage
    for (let key in this.data) {
      const item = this.getItem(key);
      item?.persistent?.removeValue();
    }

    // Reset Groups
    for (let key in this.groups) this.getGroup(key)?.reset();

    // Reset Data
    this.data = {};
    this.size = 0;

    // Reselect Items
    for (let key in this.selectors) {
      const selector = this.getSelector(key);
      selector?.select(selector?.itemKey, { force: true });
    }
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
      const group = this.getGroup(groupKey);
      _itemKeys.forEach((itemKey) => {
        group?.add(itemKey, config);
      });
    });
  }

  //=========================================================================================================
  // Update Item Key
  //=========================================================================================================
  /**
   * @internal
   * Updates ItemKey of Item
   * @param oldItemKey - Old ItemKey
   * @param newItemKey - New ItemKey
   * @param config - Config
   */
  private updateItemKey(
    oldItemKey: ItemKey,
    newItemKey: ItemKey,
    config?: UpdateItemKeyConfigInterface
  ): void {
    const item = this.getItem(oldItemKey);
    config = defineConfig(config, {
      background: false,
    });

    if (!item || oldItemKey === newItemKey) return;

    // Remove Item from old ItemKey and add Item to new ItemKey
    delete this.data[oldItemKey];
    this.data[newItemKey] = item;

    // Update Key/Name of Item
    item.key = newItemKey;

    // Update persist Key of Item (Doesn't get changed by setting new item key because PersistKey is not ItemKey)
    item.persistent?.setKey(
      CollectionPersistent.getItemStorageKey(newItemKey, this.key)
    );

    // Update Groups
    for (let groupName in this.groups) {
      const group = this.getGroup(groupName);
      if (!group || group.isPlaceholder || !group.has(oldItemKey)) continue;

      // Replace old ItemKey with new ItemKey
      const newGroupValue = copy(group.value);
      newGroupValue.splice(newGroupValue.indexOf(oldItemKey), 1, newItemKey);
      group.set(newGroupValue, { background: config?.background });
    }

    // Update Selectors
    for (let selectorName in this.selectors) {
      const selector = this.getSelector(selectorName);
      if (!selector || selector.itemKey !== oldItemKey) continue;

      // Replace old selected ItemKey with new ItemKey
      selector.select(newItemKey, { background: config?.background });
    }
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
        const group = this.getGroup(groupKey);
        if (!group) return;
        group.remove(itemKey);
        removedFromGroupsCount++;
      });

      // If Item got removed from every Groups in Collection, remove it completely
      if (removedFromGroupsCount >= this.getGroupCount())
        this.removeItems(itemKey);
    });
  }

  //=========================================================================================================
  // Remove Items
  //=========================================================================================================
  /**
   * @public
   * Removes Item/s from Group/s
   * @param itemKeys - ItemKey/s of Item/s that get removed from Collection
   */
  public removeItems(itemKeys: ItemKey | Array<ItemKey>): void {
    const _itemKeys = normalizeArray<ItemKey>(itemKeys);

    _itemKeys.forEach((itemKey) => {
      const item = this.getItem(itemKey);
      if (!item) return;

      // Remove Item from Groups
      for (let groupKey in this.groups) {
        const group = this.getGroup(groupKey);
        if (group && group.has(itemKey)) group.remove(itemKey);
      }

      // Remove Selectors that represents this Item
      for (let selectorKey in this.selectors) {
        const selector = this.getSelector(selectorKey);
        if (selector?.itemKey === itemKey) this.removeSelector(selectorKey);
      }

      // Remove Item from Storage
      item.persistent?.removeValue();

      // Remove Item from Collection
      delete this.data[itemKey];

      this.size--;
    });
  }

  //=========================================================================================================
  // Set Data
  //=========================================================================================================
  /**
   * @internal
   * Creates/Updates Item from provided Data and adds it to the Collection
   * @param data - Data from which the Item gets created/updated
   * @param config - Config
   */
  public setData(
    data: DataType,
    config: { patch?: boolean; background?: boolean } = {}
  ): boolean {
    const _data = data as any; // Transformed Data to any because of unknown Object (DataType)
    const primaryKey = this.config.primaryKey;
    config = defineConfig(config, {
      patch: false,
      background: false,
    });

    if (!isValidObject(_data)) {
      console.error("Agile: Collections items has to be an object!");
      return false;
    }

    if (!_data.hasOwnProperty(primaryKey)) {
      console.error(
        `Agile: Collection Item needs a primary Key property called '${this.config.primaryKey}'!`
      );
      return false;
    }

    const itemKey = _data[primaryKey];
    let item: Item<DataType> | undefined = this.data[itemKey];

    // Create or update Item
    if (item && config.patch)
      item.patch(_data, { background: config.background });
    if (item && !config.patch)
      item.set(_data, { background: config.background });
    if (!item) {
      item = new Item<DataType>(this, _data);
      this.size++;
    }

    // Set new Item at itemKey
    this.data[itemKey] = item;

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
      sideEffects: true,
    });

    // Rebuild Groups that include ItemKey
    for (let groupKey in this.groups) {
      const group = this.getGroup(groupKey);
      if (group && group.has(itemKey)) {
        // group.rebuild(); Not necessary because a sideEffect of the Group is to rebuild it self
        group.ingest({
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
export type ItemKey = string | number; // Key Interface of Item in Collection

/**
 * @param key - Key/Name of Collection
 * @param groups - Groups of Collection
 * @param selectors - Selectors of Collection
 * @param primaryKey - Name of Property that holds the PrimaryKey (default = id)
 * @param defaultGroupKey - Key/Name of Default Group that holds all collected Items
 */
export interface CreateCollectionConfigInterface {
  groups?: { [key: string]: Group<any> } | string[];
  selectors?: { [key: string]: Selector<any> } | string[];
  key?: CollectionKey;
  primaryKey?: string;
  defaultGroupKey?: ItemKey;
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
 */
export interface CollectConfigInterface<DataType = any> {
  patch?: boolean;
  method?: "push" | "unshift";
  forEachItem?: (data: DataType, key: ItemKey, index: number) => void;
  background?: boolean;
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
  sideEffects?: boolean;
}

/**
 * @param notExisting - If also official not existing Items like Placeholder get found
 */
export interface GetItemConfigInterface {
  notExisting?: boolean;
}

/**
 * @param notExisting - If also official not existing Groups like Placeholder get found
 */
export interface GetGroupConfigInterface {
  notExisting?: boolean;
}

/**
 * @param notExisting - If also official not existing Selectors like Placeholder get found
 */
export interface GetSelectorConfigInterface {
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

export type CollectionConfig<DataType = DefaultItem> =
  | CreateCollectionConfigInterface
  | ((collection: Collection<DataType>) => CreateCollectionConfigInterface);
