import {
  Agile,
  Item,
  Group,
  GroupKey,
  Selector,
  SelectorKey,
  StateKey,
  StorageKey,
  GroupConfigInterface,
  defineConfig,
  flatMerge,
  isValidObject,
  normalizeArray,
  copy,
  CollectionPersistent,
} from "../internal";

export class Collection<DataType = DefaultItem> {
  public agileInstance: () => Agile;

  public config: CollectionConfigInterface;

  public size: number = 0; // Amount of Items stored in Collection
  public data: { [key: string]: Item<DataType> } = {}; // Collection Data
  public _key?: CollectionKey;
  public isPersisted: boolean = false; // If Collection is stored in Storage
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
    if (typeof config === "function") config = config(this);
    this.config = defineConfig<CollectionConfigInterface>(config, {
      primaryKey: "id",
      groups: {},
      selectors: {},
      defaultGroupKey: "default",
    });
    this._key = this.config.key;

    this.initGroups();
    this.initSelectors();
  }

  /**
   * @public
   * Set Key/Name of Collection
   */
  public set key(value: StateKey | undefined) {
    this._key = value;
  }

  /**
   * @public
   * Get Key/Name of Collection
   */
  public get key(): StateKey | undefined {
    return this._key;
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
    return new Group<DataType>(
      this.agileInstance(),
      this,
      initialItems,
      config
    );
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
  private initGroups() {
    const groups = copy(this.config.groups);
    if (!groups) return;
    let groupsObject: { [key: string]: Group } = {};

    // If groups is Array of SelectorNames transform it to Selector Object
    if (Array.isArray(groups)) {
      groups.forEach((groupKey) => {
        groupsObject[groupKey] = new Group(this.agileInstance(), this, [], {
          key: groupKey,
        });
      });
    } else groupsObject = groups;

    // Add default Group
    groupsObject[this.config.defaultGroupKey || "default"] = new Group(
      this.agileInstance(),
      this,
      [],
      {
        key: this.config.defaultGroupKey || "default",
      }
    );

    // Set Key/Name of Selector to property Name
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
  private initSelectors() {
    const selectors = copy(this.config.selectors);
    if (!selectors) return;
    let selectorsObject: { [key: string]: Selector } = {};

    // If selectors is Array of SelectorNames transform it to Selector Object
    if (Array.isArray(selectors)) {
      selectors.forEach((selectorKey) => {
        selectorsObject[selectorKey] = new Selector(this, selectorKey, {
          key: selectorKey,
        });
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
   * @param items - Item/s you want to collect
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
    const defaultGroupKey = this.config.defaultGroupKey || "default";
    const primaryKey = this.config.primaryKey || "id";

    config = defineConfig<CollectConfigInterface>(config, {
      method: "push",
      background: false,
      patch: false,
    });

    // Add default GroupKey
    if (!groupKeys.includes(defaultGroupKey)) groupKeys.push(defaultGroupKey);

    // Create not existing Groups
    groupKeys.forEach(
      (groupName) => !this.groups[groupName] && this.createGroup(groupName)
    );

    // Instantiate added Items
    _items.forEach((item, index) => {
      const itemKey = item[primaryKey];
      const itemExists = !!this.data[itemKey];

      // Save Item in Collection
      const success = this.saveData(item, {
        patch: config.patch,
        background: config.background,
      });
      if (!success) return this;

      // Add ItemKey to provided Groups
      groupKeys.forEach((groupKey) => {
        this.groups[groupKey].add(itemKey, {
          method: config.method,
          background: config.background,
        });
      });

      // Ingest Group that includes ItemKey into Runtime, which than rebuilds the Group
      if (!itemExists) {
        for (let groupKey in this.groups) {
          const group = this.getGroup(groupKey);
          if (group.value.includes(itemKey)) {
            if (!config.background) group.ingest({ forceRerender: true });
          }
        }
      }

      // Call forEachItem Method (config)
      if (config.forEachItem) config.forEachItem(item, itemKey, index);
    });

    return this;
  }

  //=========================================================================================================
  // Update
  //=========================================================================================================
  /**
   * @public
   * Updates Item at provided Key
   * @param itemKey - ItemKey of updated Item
   * @param changes - Changes that will be merged into Item
   * @param config - Config
   */
  public update(
    itemKey: ItemKey,
    changes: DefaultItem | DataType,
    config: UpdateConfigInterface = {}
  ): Item | undefined {
    if (!this.data.hasOwnProperty(itemKey)) {
      console.error(
        `Agile: ItemKey '${itemKey} doesn't exist in Collection!`,
        this
      );
      return undefined;
    }

    const item = this.data[itemKey];
    const primaryKey = this.config.primaryKey || "";
    config = defineConfig(config, {
      addNewProperties: false,
      background: false,
    });

    // Merge changes into ItemValue
    const newItemValue = flatMerge(item.nextStateValue, changes, {
      addNewProperties: config.addNewProperties,
    });

    // Update primaryKey of Item if it has changed
    if (item.value[primaryKey] !== newItemValue[primaryKey])
      this.updateItemKey(item.value[primaryKey], newItemValue[primaryKey], {
        background: config.background,
      });

    // Apply changes to Item
    item.set(newItemValue, { background: config.background });

    return this.data[newItemValue[primaryKey]];
  }

  //=========================================================================================================
  // Create Group
  //=========================================================================================================
  /**
   * @public
   * Creates new Group that holds Items of Collection
   * @param groupName - Name/Key of Group
   * @param initialItems - Initial ItemKeys of Group
   */
  public createGroup(
    groupName: GroupKey,
    initialItems?: Array<ItemKey>
  ): Group<DataType> {
    if (this.groups.hasOwnProperty(groupName)) {
      console.warn(
        `Agile: The Group with the name ${groupName} already exists!`
      );
      return this.groups[groupName];
    }

    // Create new Group
    const group = new Group<DataType>(
      this.agileInstance(),
      this,
      initialItems,
      { key: groupName }
    );
    this.groups[groupName] = group;

    // Logging
    if (this.agileInstance().config.logJobs)
      console.log(`Agile: Created new Group called '${groupName}'`, group);

    return group;
  }

  //=========================================================================================================
  // Create Selector
  //=========================================================================================================
  /**
   * @public
   * Creates new Selector that represents an Item of the Collection
   * @param selectorName - Name/Key of Selector
   * @param key - Key of Item that the Selector represents
   */
  public createSelector(
    selectorName: SelectorKey,
    key: ItemKey
  ): Selector<DataType> {
    if (this.selectors.hasOwnProperty(selectorName)) {
      console.warn(
        `Agile: The Selector with the name ${selectorName} already exists!`
      );
      return this.selectors[selectorName];
    }

    // Create new Selector
    const selector = new Selector<DataType>(this, key, { key: selectorName });
    this.selectors[selectorName] = selector;

    // Logging
    if (this.agileInstance().config.logJobs)
      console.log(`Agile: Created Selector called '${selectorName}'`, selector);

    return selector;
  }

  //=========================================================================================================
  // Get Group
  //=========================================================================================================
  /**
   * @public
   * Gets Group by Key/Name
   * @param groupName - Name/Key of Group
   */
  public getGroup(groupName: GroupKey): Group<DataType> {
    if (!this.groups[groupName]) {
      console.warn(`Agile: Group with key/name '${groupName}' doesn't exist!`);

      // Return empty group because it might get annoying to handle with undefined (can check if it exists with group.exists)
      const group = new Group<DataType>(this.agileInstance(), this, [], {
        key: "dummy",
      });
      group.isPlaceholder = true;
      return group;
    }

    return this.groups[groupName];
  }

  //=========================================================================================================
  // Get Selector
  //=========================================================================================================
  /**
   * @public
   * Gets Selector by Key/Name
   * @param selectorName - Name/Key of Selector
   */
  public getSelector(
    selectorName: SelectorKey
  ): Selector<DataType> | undefined {
    if (!this.selectors[selectorName]) {
      console.warn(
        `Agile: Selector with name '${selectorName}' doesn't exist!`
      );
      return undefined;
    }

    return this.selectors[selectorName];
  }

  //=========================================================================================================
  // Remove
  //=========================================================================================================
  /**
   * @public
   * Remove Items from special Group or from everywhere
   * @param itemKeys - ItemKey/s that get removed
   */
  public remove(itemKeys: ItemKey | Array<ItemKey>) {
    return {
      fromGroups: (groups: Array<ItemKey> | ItemKey) =>
        this.removeFromGroups(itemKeys, groups),
      everywhere: () => this.removeData(itemKeys),
    };
  }

  //=========================================================================================================
  // Get Item by Id
  //=========================================================================================================
  /**
   * @public
   * Gets Item by Id
   * @param itemKey - ItemKey of Item that might get found
   */
  public getItemById(itemKey: ItemKey): Item<DataType> | undefined {
    if (!this.data.hasOwnProperty(itemKey) || !this.data[itemKey].exists)
      return undefined;

    const item = this.data[itemKey];

    // Add State to tracked Observers (for auto tracking used observers in computed function)
    if (this.agileInstance().runtime.trackObservers)
      this.agileInstance().runtime.foundObservers.add(item.observer);

    return item;
  }

  //=========================================================================================================
  // Get Value by Id
  //=========================================================================================================
  /**
   * @public
   * Gets ItemValue by Id
   * @param itemKey - ItemKey of ItemValue that might get found
   */
  public getValueById(itemKey: ItemKey): DataType | undefined {
    let data = this.getItemById(itemKey);
    if (!data) return undefined;
    return data.value;
  }

  //=========================================================================================================
  // Persist
  //=========================================================================================================
  /**
   * @public
   * Saves Collection Value into Agile Storage permanently
   * @param key - Storage Key (Note: not needed if Collection has key/name)
   */
  public persist(key?: StorageKey): this {
    // Check if Collection is already persisted if so only change key if provided
    if (this.isPersisted && this.persistent) {
      console.warn(`Agile: Collection '${this.key}' is already persisted!`);

      // Update Persistent Key
      if (key) this.persistent.key = key;
      return this;
    }

    this.persistent = new CollectionPersistent(this.agileInstance(), this, key);
    return this;
  }

  //=========================================================================================================
  // Group Size
  //=========================================================================================================
  /**
   * @internal
   * Returns the count of Groups
   */
  public groupsSize(): number {
    let size = 0;
    for (let group in this.groups) size++;
    return size;
  }

  //=========================================================================================================
  // Selector Size
  //=========================================================================================================
  /**
   * @internal
   * Returns the count of Selectors
   */
  public selectorsSize(): number {
    let size = 0;
    for (let selector in this.selectors) size++;
    return size;
  }

  //=========================================================================================================
  // Update Item Key
  //=========================================================================================================
  /**
   * @internal
   * Updates ItemKey of Item
   * @param oldItemKey - Old ItemKey of Item
   * @param newItemKey - New ItemKey of Item
   * @param config - Config
   */
  private updateItemKey(
    oldItemKey: ItemKey,
    newItemKey: ItemKey,
    config?: UpdateItemKeyInterface
  ): void {
    if (oldItemKey === newItemKey) return;
    config = defineConfig(config, {
      background: false,
    });
    const item = this.data[oldItemKey];

    // Delete old Item at old ItemKey
    delete this.data[oldItemKey];

    // Add new Item at new ItemKey
    this.data[newItemKey] = item;

    // Update Key/Name of Item
    if (item.key === oldItemKey) item.key = newItemKey;

    // Update Groups
    for (let groupName in this.groups) {
      const group = this.getGroup(groupName);
      if (group.isPlaceholder || !group.value.includes(oldItemKey)) continue;

      // Replace old ItemKey with new ItemKey
      const newGroupValue = copy(group.value);
      newGroupValue.splice(newGroupValue.indexOf(oldItemKey), 1, newItemKey);
      group.set(newGroupValue, { background: config?.background });
    }

    // Update Selectors
    for (let selectorName in this.selectors) {
      const selector = this.getSelector(selectorName);
      if (!selector || selector.id !== oldItemKey) continue;

      // Replace old ItemKey with new ItemKey
      selector.select(newItemKey, { background: config?.background });
    }
  }

  //=========================================================================================================
  // Remove From Groups
  //=========================================================================================================
  /**
   * @public
   * Removes Item/s(ItemKey/s) from Group/s(GroupKey/s)
   * @param itemKeys - ItemKey/s that get removed from Group
   * @param groupKeys - GroupKey/s of Group/s form which the ItemKey/s will be removed
   */
  public removeFromGroups(
    itemKeys: ItemKey | Array<ItemKey>,
    groupKeys: GroupKey | Array<GroupKey>
  ): void {
    const _itemKeys = normalizeArray(itemKeys);
    const _groupKeys = normalizeArray(groupKeys);
    const removedFromGroupKeys: Array<GroupKey> = [];

    // Remove ItemKeys from Groups
    _groupKeys.forEach((groupKey) => {
      if (!this.groups[groupKey]) {
        console.error(
          `Agile: Couldn't find Group '${groupKey}' in Collection ${this.key}`
        );
        return;
      }

      // Remove ItemKeys from Group
      _itemKeys.forEach((itemKey) => {
        const group = this.getGroup(groupKey);
        group.remove(itemKey);
      });
      removedFromGroupKeys.push(groupKey);
    });

    // If Item got removed from all Groups of Collection remove it completely
    if (removedFromGroupKeys.length >= this.groupsSize()) {
      _itemKeys.forEach((itemKey) => this.removeData(itemKey));
    }
  }

  //=========================================================================================================
  // Delete Data
  //=========================================================================================================
  /**
   * @public
   * Removes Item/s(ItemKey/s) from Group/s(GroupKey/s)
   * @param itemKeys - ItemKey/s that get removed from Collection
   */
  public removeData(itemKeys: ItemKey | Array<ItemKey>): void {
    const _itemKeys = normalizeArray<ItemKey>(itemKeys);

    _itemKeys.forEach((itemKey) => {
      if (!this.data[itemKey]) {
        console.error(
          `Agile: Couldn't find itemKey '${itemKey}' in Collection '${this.key}'`
        );
        return;
      }

      // Remove Item from Groups
      for (let groupKey in this.groups) this.groups[groupKey].remove(itemKey);

      // Remove Selectors that represents this Item
      for (let selectorKey in this.selectors)
        delete this.selectors[selectorKey];

      // Remove Item from Collection
      delete this.data[itemKey];

      this.size--;
    });
  }

  //=========================================================================================================
  // Save Data
  //=========================================================================================================
  /**
   * @internal
   * Saves Data into Collection
   * @param data - Data that gets saved into Collection (needs primaryKey)
   * @param config - Config
   */
  public saveData(
    data: DataType,
    config: { patch?: boolean; background?: boolean } = {}
  ): boolean {
    const _data = data as any; // Transformed Data to any because of unknown Object (DataType)
    const primaryKey = this.config.primaryKey || "id";
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
    let item: Item<DataType> = this.data[itemKey];

    // Create or update Item
    if (item && config.patch)
      item = item.patch(_data, { background: config.background });
    if (item && !config.patch)
      item = item.set(_data, { background: config.background });
    if (!item) {
      item = new Item<DataType>(this, _data);
      this.size++;
    }

    // Reset isPlaceholder of Item since it got an value
    if (item.isPlaceholder) item.isPlaceholder = false;

    // Set new Item at itemKey
    this.data[itemKey] = item;

    return true;
  }

  //=========================================================================================================
  // Rebuild Groups That Includes Primary Key
  //=========================================================================================================
  /**
   * @internal
   * Rebuilds Groups that includes ItemKey
   * @itemKey - ItemKey that a Group have to contain to get rebuild
   * @config - Config
   */
  public rebuildGroupsThatIncludePrimaryKey(
    itemKey: ItemKey,
    config?: { background?: boolean; forceRerender?: boolean }
  ): void {
    config = defineConfig(config, {
      background: false,
      forceRerender: !config?.background, // because forceRerender has more weight than background
    });

    // Rebuild Groups that include ItemKey
    for (let groupKey in this.groups) {
      const group = this.getGroup(groupKey);
      if (group.has(itemKey))
        group.ingest({
          background: config?.background,
          forceRerender: config?.forceRerender,
        });
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
export interface CollectionConfigInterface {
  groups?: { [key: string]: Group<any> } | string[];
  selectors?: { [key: string]: Selector<any> } | string[];
  key?: CollectionKey;
  primaryKey?: string;
  defaultGroupKey?: ItemKey;
}

/**
 * @param patch - If Item gets patched into existing Item
 * @param method - Way of adding Item to Collection (push, unshift)
 * @param forEachItem - Loops through collected Items
 * @param background - If collecting an Item happens in the background (-> not causing any rerender)
 */
export interface CollectConfigInterface<DataType = any> {
  patch?: boolean;
  method?: "push" | "unshift";
  forEachItem?: (item: DataType, key: ItemKey, index: number) => void;
  background?: boolean;
}

/**
 * @param addNewProperties -
 * @param background - If updating an Item happens in the background (-> not causing any rerender)
 */
export interface UpdateConfigInterface {
  addNewProperties?: boolean;
  background?: boolean;
}

/**
 * @param background - If updating the primaryKey of an Item happens in the background (-> not causing any rerender)
 */
export interface UpdateItemKeyInterface {
  background?: boolean;
}

export type CollectionConfig<DataType = DefaultItem> =
  | CollectionConfigInterface
  | ((collection: Collection<DataType>) => CollectionConfigInterface);
