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
  GroupAddConfigInterface,
  ComputedTracker,
  generateId,
  SideEffectConfigInterface,
  SelectorConfigInterface,
  removeProperties,
  isFunction,
  LogCodeManager,
} from '../internal';

export class Collection<DataType extends Object = DefaultItem> {
  public agileInstance: () => Agile;

  public config: CollectionConfigInterface;
  private initialConfig: CreateCollectionConfigInterface;

  public size = 0; // Amount of Items stored in Collection
  public data: { [key: string]: Item<DataType> } = {}; // Collection Data
  public _key?: CollectionKey;
  public isPersisted = false; // If Collection can be stored in Agile Storage (-> successfully integrated persistent)
  public persistent: CollectionPersistent<DataType> | undefined; // Manages storing Collection Value into Storage

  public groups: { [key: string]: Group<DataType> } = {};
  public selectors: { [key: string]: Selector<DataType> } = {};

  public isInstantiated = false;

  /**
   * Class that holds a List of Objects with key and causes rerender on subscribed Components
   *
   * @public
   *
   * @param agileInstance - Instance of Agile the Collection belongs to
   *
   * @param config - Configuration
   */
  constructor(agileInstance: Agile, config: CollectionConfig<DataType> = {}) {
    this.agileInstance = () => agileInstance;
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

    // Reselect Selector Items
    // Necessary because the selection of an Item
    // hasn't worked with a not 'instantiated' Collection
    for (const key in this.selectors) this.selectors[key].reselect();

    // Rebuild of Groups
    // Not necessary because if Items are added to the Collection,
    // the Groups which contain these added Items get rebuilt.
    // for (const key in this.groups) this.groups[key].rebuild();
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
    config: GroupConfigInterface = {}
  ): Group<DataType> {
    if (this.isInstantiated) {
      const key = config.key ?? generateId();
      LogCodeManager.log('1B:02:00');
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
    config: SelectorConfigInterface = {}
  ): Selector<DataType> {
    if (this.isInstantiated) {
      const key = config.key ?? generateId();
      LogCodeManager.log('1B:02:01');
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
      if (groupsObject[key]._key == null) groupsObject[key].setKey(key);

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
      if (selectorsObject[key]._key == null) selectorsObject[key].setKey(key);

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
    data: DataType | Item<DataType> | Array<DataType | Item<DataType>>,
    groupKeys?: GroupKey | Array<GroupKey>,
    config: CollectConfigInterface<DataType> = {}
  ): this {
    const _data = normalizeArray<DataType | Item<DataType>>(data);
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
    _groupKeys.forEach(
      (key) => this.groups[key] == null && this.createGroup(key)
    );

    _data.forEach((data, index) => {
      const itemKey = data[primaryKey];
      let success = false;

      // Assign Data or Item to Collection
      if (data instanceof Item) {
        success = this.assignItem(data, {
          background: config.background,
        });
      } else {
        success = this.assignData(data, {
          patch: config.patch,
          background: config.background,
        });
      }

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
      patch: true,
      background: false,
    });

    if (item == null) {
      LogCodeManager.log('1B:03:00', [itemKey, this._key]);
      return undefined;
    }
    if (!isValidObject(changes)) {
      LogCodeManager.log('1B:03:01', [itemKey, this._key]);
      return undefined;
    }

    const oldItemKey = item._value[primaryKey];
    const newItemKey = changes[primaryKey] || oldItemKey;
    const updateItemKey = oldItemKey !== newItemKey;

    // Update ItemKey
    if (updateItemKey)
      this.updateItemKey(oldItemKey, newItemKey, {
        background: config.background,
      });

    // Patch changes into Item
    if (config.patch) {
      // Delete primaryKey from 'changes' because if it has changed, it gets properly updated in 'updateItemKey' (see above)
      if (changes[primaryKey]) delete changes[primaryKey];

      let patchConfig: { addNewProperties?: boolean } =
        typeof config.patch === 'object' ? config.patch : {};
      patchConfig = defineConfig(patchConfig, {
        addNewProperties: true,
      });

      // Apply changes to Item
      item.patch(changes as any, {
        background: config.background,
        addNewProperties: patchConfig.addNewProperties,
      });
    }

    // Set changes into Item
    if (!config.patch) {
      // To make sure that the primaryKey doesn't differ from the changes object primaryKey
      if (changes[this.config.primaryKey] !== itemKey) {
        changes[this.config.primaryKey] = itemKey;
        LogCodeManager.log('1B:02:02', [], changes);
      }

      // Apply changes to Item
      item.set(changes as any, {
        background: config.background,
      });
    }

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

    if (!this.isInstantiated) LogCodeManager.log('1B:02:03');

    // Check if Group already exists
    if (group != null) {
      if (!group.isPlaceholder) {
        LogCodeManager.log('1B:03:02', [groupKey]);
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

  /**
   * Retrieves a single Group by key/name.
   *
   * [Learn more..](https://agile-ts.org/docs/core/collection/methods/#getgroup)
   *
   * @public
   * @param groupKey - key/name Group identifier
   * @param config - Configuration
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
    if (group == null || (!config.notExisting && group.isPlaceholder))
      return undefined;

    ComputedTracker.tracked(group.observer);
    return group;
  }

  //=========================================================================================================
  // Get Default Group
  //=========================================================================================================
  /**
   * @public
   * Get default Group of Collection
   */
  public getDefaultGroup(): Group<DataType> | undefined {
    return this.getGroup(this.config.defaultGroupKey);
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
    if (group == null) {
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
    if (this.groups[groupKey] == null) return this;
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

    if (!this.isInstantiated) LogCodeManager.log('1B:02:04');

    // Check if Selector already exists
    if (selector != null) {
      if (!selector.isPlaceholder) {
        LogCodeManager.log('1B:03:03', [selectorKey]);
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
  // Select
  //=========================================================================================================
  /**
   * @public
   * Creates new Selector that represents an Item of the Collection
   * @param itemKey - Key of Item which the Selector represents
   */
  public select(itemKey: ItemKey): Selector<DataType> {
    return this.createSelector(itemKey, itemKey);
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
    if (selector == null || (!config.notExisting && selector.isPlaceholder))
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
    if (selector == null) {
      selector = new Selector<DataType>(
        this,
        Selector.unknownItemPlaceholderKey,
        {
          key: selectorKey,
          isPlaceholder: true,
        }
      );
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
    if (this.selectors[selectorKey] == null) return this;
    this.selectors[selectorKey].unselect(); // Unselects current selected Item
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
    const item = itemKey != null ? this.data[itemKey] : undefined;

    // Check if Item exists
    if (item == null || (!config.notExisting && !item.exists)) return undefined;

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
    if (item == null) item = this.createPlaceholderItem(itemKey, true);

    ComputedTracker.tracked(item.observer);
    return item;
  }

  /**
   * Creates a placeholder Item
   * that can be used to hold a reference to an Item that doesn't exist yet.
   *
   * @internal
   * @param itemKey - Key/Name identifier of the Item to be created.
   * @param addToCollection - Whether the created Item should be added to the Collection.
   */
  public createPlaceholderItem(
    itemKey: ItemKey,
    addToCollection = false
  ): Item<DataType> {
    const item = new Item<DataType>(
      this,
      {
        [this.config.primaryKey]: itemKey, // Setting PrimaryKey of Item to passed itemKey
        dummy: 'item',
      } as any,
      { isPlaceholder: true }
    );

    if (
      addToCollection &&
      !Object.prototype.hasOwnProperty.call(this.data, itemKey)
    )
      this.data[itemKey] = item;

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
    if (item == null) return undefined;
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

    const defaultGroup = this.getDefaultGroup();
    let items: Array<Item<DataType>> = [];

    // If config.notExisting transform this.data into array, otherwise return the default Group items
    if (config.notExisting) {
      for (const key in this.data) items.push(this.data[key]);
    } else {
      // Why defaultGroup Items and not all .exists === true Items?
      // Because the default Group keeps track of all existing Items
      // It also does control the Collection output in useAgile() and should do it here too
      items = defaultGroup?.items || [];
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
      loadValue: true,
      storageKeys: [],
      defaultStorageKey: null,
    });

    // Check if Collection is already persisted
    if (this.persistent != null && this.isPersisted) return this;

    // Create persistent -> Persist Value
    this.persistent = new CollectionPersistent<DataType>(this, {
      instantiate: _config.loadValue,
      storageKeys: _config.storageKeys,
      key: key,
      defaultStorageKey: _config.defaultStorageKey,
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
    if (!this.persistent) return this;

    // Check if Callback is valid Function
    if (!isFunction(callback)) {
      LogCodeManager.log('00:03:01', ['OnLoad Callback', 'function']);
      return this;
    }

    this.persistent.onLoad = callback;

    // If Collection is already 'isPersisted' the loading was successful -> callback can be called
    if (this.isPersisted) callback(true);

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
  public reset(): this {
    // Reset Data
    this.data = {};
    this.size = 0;

    // Reset Groups
    for (const key in this.groups) this.getGroup(key)?.reset();

    // Reset Selectors
    for (const key in this.selectors) this.getSelector(key)?.reset();

    return this;
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
    config: GroupAddConfigInterface = {}
  ): this {
    const _itemKeys = normalizeArray(itemKeys);
    const _groupKeys = normalizeArray(groupKeys);

    // Add ItemKeys to Groups
    _groupKeys.forEach((groupKey) => {
      this.getGroup(groupKey)?.add(_itemKeys, config);
    });

    return this;
  }

  //=========================================================================================================
  // Move
  //=========================================================================================================
  /**
   * @public
   * Move ItemKey/s from one Group to another
   * @param itemKeys - ItemKey/s that are moved
   * @param oldGroupKey - GroupKey of the Group that currently keeps the Items at itemKey/s
   * @param newGroupKey - GroupKey of the Group into which the Items at itemKey/s are moved
   * @param config - Config
   */
  public move(
    itemKeys: ItemKey | Array<ItemKey>,
    oldGroupKey: GroupKey,
    newGroupKey: GroupKey,
    config: GroupAddConfigInterface = {}
  ): this {
    const _itemKeys = normalizeArray(itemKeys);

    // Remove itemKeys from old Group
    this.getGroup(oldGroupKey)?.remove(
      _itemKeys,
      removeProperties(config, ['method', 'overwrite'])
    );

    // Add itemKeys to new Group
    this.getGroup(newGroupKey)?.add(_itemKeys, config);

    return this;
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

    if (item == null || oldItemKey === newItemKey) return false;

    // Check if Item with newItemKey already exists
    if (this.hasItem(newItemKey)) {
      LogCodeManager.log('1B:03:04', [oldItemKey, newItemKey, this._key]);
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
      if (!group?.has(oldItemKey)) continue;
      group?.replace(oldItemKey, newItemKey, { background: config.background });
    }

    // Update ItemKey in Selectors
    for (const selectorKey in this.selectors) {
      const selector = this.getSelector(selectorKey, { notExisting: true });
      if (selector == null) continue;

      // Reselect Item in Selector that has selected the newItemKey
      // Necessary because the reference placeholder Item got removed
      // and replaced with the new Item (Item of which the primaryKey was renamed)
      // -> needs to find new Item with the same itemKey
      if (selector.hasSelected(newItemKey, false)) {
        selector.reselect({
          force: true, // Because ItemKeys are the same
          background: config.background,
        });
      }

      // Select newItemKey in Selector that has selected the oldItemKey
      if (selector.hasSelected(oldItemKey, false))
        selector.select(newItemKey, {
          background: config.background,
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
  public remove(
    itemKeys: ItemKey | Array<ItemKey>
  ): {
    fromGroups: (groups: Array<ItemKey> | ItemKey) => Collection<DataType>;
    everywhere: (config?: RemoveItemsConfigInterface) => Collection<DataType>;
  } {
    return {
      fromGroups: (groups: Array<ItemKey> | ItemKey) =>
        this.removeFromGroups(itemKeys, groups),
      everywhere: (config) => this.removeItems(itemKeys, config || {}),
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
  ): this {
    const _itemKeys = normalizeArray(itemKeys);
    const _groupKeys = normalizeArray(groupKeys);

    _itemKeys.forEach((itemKey) => {
      let removedFromGroupsCount = 0;

      // Remove ItemKey from Groups
      _groupKeys.forEach((groupKey) => {
        const group = this.getGroup(groupKey, { notExisting: true });
        if (!group?.has(itemKey)) return;
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

    return this;
  }

  //=========================================================================================================
  // Remove Items
  //=========================================================================================================
  /**
   * @public
   * Removes Item completely from Collection
   * @param itemKeys - ItemKey/s of Item/s
   * @param config - Config
   */
  public removeItems(
    itemKeys: ItemKey | Array<ItemKey>,
    config: RemoveItemsConfigInterface = {}
  ): this {
    config = defineConfig(config, {
      notExisting: false,
      removeSelector: false,
    });
    const _itemKeys = normalizeArray<ItemKey>(itemKeys);

    _itemKeys.forEach((itemKey) => {
      const item = this.getItem(itemKey, { notExisting: config.notExisting });
      if (item == null) return;
      const wasPlaceholder = item.isPlaceholder;

      // Remove Item from Groups
      for (const groupKey in this.groups) {
        const group = this.getGroup(groupKey, { notExisting: true });
        if (group?.has(itemKey)) group?.remove(itemKey);
      }

      // Remove Item from Storage
      item.persistent?.removePersistedValue();

      // Remove Item from Collection
      delete this.data[itemKey];

      // Reselect or remove Selectors representing the removed Item
      for (const selectorKey in this.selectors) {
        const selector = this.getSelector(selectorKey, { notExisting: true });
        if (selector?.hasSelected(itemKey, false)) {
          if (config.removeSelector) {
            // Remove Selector
            this.removeSelector(selector?._key ?? 'unknown');
          } else {
            // Reselect Item in Selector (to create new dummyItem to hold a reference to this removed Item)
            selector?.reselect({ force: true });
          }
        }
      }

      if (!wasPlaceholder) this.size--;
    });

    return this;
  }

  /**
   * Assigns provided data object to an already existing Item at itemKey.
   * If Item at itemKey doesn't exist yet,
   * a new Item with the data object as value is created and added to the Collection.
   *
   * @internal
   * @param data - Data object
   * @param config - Configuration object
   */
  public assignData(
    data: DataType,
    config: AssignDataConfigInterface = {}
  ): boolean {
    config = defineConfig(config, {
      patch: false,
      background: false,
    });
    const _data = copy(data); // Copy data object to get rid of reference
    const primaryKey = this.config.primaryKey;

    if (!isValidObject(_data)) {
      LogCodeManager.log('1B:03:05', [this._key]);
      return false;
    }

    // Check if data object contains valid itemKey
    // otherwise add random itemKey to Item
    if (!Object.prototype.hasOwnProperty.call(_data, primaryKey)) {
      LogCodeManager.log('1B:02:05', [this._key, primaryKey]);
      _data[primaryKey] = generateId();
    }

    const itemKey = _data[primaryKey];
    const item = this.getItem(itemKey, { notExisting: true });
    const wasPlaceholder = item?.isPlaceholder || false;

    // Create new Item or update existing Item
    if (item != null) {
      if (config.patch) {
        item.patch(_data, { background: config.background });
      } else {
        item.set(_data, { background: config.background });
      }
    } else {
      this.assignItem(new Item<DataType>(this, _data), {
        background: config.background,
      });
    }

    // Increase size of Collection if Item was previously a placeholder
    // (-> didn't officially exit in Collection)
    if (wasPlaceholder) this.size++;

    return true;
  }

  /**
   * Adds provided Item to the Collection.
   *
   * @internal
   * @param item - Item to be added.
   * @param config - Configuration object
   */
  public assignItem(
    item: Item<DataType>,
    config: AssignItemConfigInterface = {}
  ): boolean {
    config = defineConfig(config, {
      overwrite: false,
      background: false,
    });
    const primaryKey = this.config.primaryKey;
    let itemKey = item._value[primaryKey];
    let increaseCollectionSize = true;

    // Check if Item has valid itemKey
    // otherwise add random itemKey to Item
    if (!Object.prototype.hasOwnProperty.call(item._value, primaryKey)) {
      LogCodeManager.log('1B:02:05', [this._key, primaryKey]);
      itemKey = generateId();
      item.patch(
        { [this.config.primaryKey]: itemKey },
        { background: config.background }
      );
      item._key = itemKey;
    }

    // Check if Item belongs to this Collection
    if (item.collection() !== this) {
      LogCodeManager.log('1B:03:06', [this._key, item.collection()._key]);
      return false;
    }

    // Check if Item already exists
    if (this.getItem(itemKey) != null) {
      if (!config.overwrite) return true;
      else increaseCollectionSize = false;
    }

    // Assign/add Item to Collection
    this.data[itemKey] = item;

    // Rebuild Groups that include itemKey
    // after adding Item to Collection
    // (because otherwise it can't find the Item since it doesn't exist in Collection yet)
    this.rebuildGroupsThatIncludeItemKey(itemKey, {
      background: config.background,
    });

    if (increaseCollectionSize) this.size++;

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

export type DefaultItem = Record<string, any>; // same as { [key: string]: any };
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
  forEachItem?: (
    data: DataType | Item<DataType>,
    key: ItemKey,
    index: number
  ) => void;
  background?: boolean;
  select?: boolean;
}

/**
 * @param patch - If Data gets merged into the current Data
 * @param background - If updating an Item happens in the background (-> not causing any rerender)
 */
export interface UpdateConfigInterface {
  patch?: boolean | { addNewProperties?: boolean };
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
 * @param loadValue - If Persistent loads the persisted value into the Collection
 * @param storageKeys - Key/Name of Storages which gets used to persist the Collection Value (NOTE: If not passed the default Storage will be used)
 * @param defaultStorageKey - Default Storage Key (if not provided it takes the first index of storageKeys or the AgileTs default Storage)
 */
export interface CollectionPersistentConfigInterface {
  loadValue?: boolean;
  storageKeys?: StorageKey[];
  defaultStorageKey?: StorageKey;
}

/**
 * @property notExisting - If not existing Items like placeholder Items can be removed.
 * Keep in mind that sometimes it won't remove the Item entirely
 * because another Instance (like a Selector) needs to keep reference to it.
 * https://github.com/agile-ts/agile/pull/152
 * @property removeSelector - If Selectors that have selected an Item to be removed, should be removed too
 */
export interface RemoveItemsConfigInterface {
  notExisting?: boolean;
  removeSelector?: boolean;
}

/**
 * @property patch - If Data gets patched into existing Item
 * @property background - If assigning Data happens in background
 */
export interface AssignDataConfigInterface {
  patch?: boolean;
  background?: boolean;
}

/**
 * @property overwrite - If old Item should be overwritten
 * @property background - If assigning Data happens in background
 */
export interface AssignItemConfigInterface {
  overwrite?: boolean;
  background?: boolean;
}

export type CollectionConfig<DataType extends Object = DefaultItem> =
  | CreateCollectionConfigInterface<DataType>
  | ((
      collection: Collection<DataType>
    ) => CreateCollectionConfigInterface<DataType>);
