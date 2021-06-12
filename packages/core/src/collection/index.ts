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
  PatchOptionConfigInterface,
} from '../internal';

export class Collection<DataType extends Object = DefaultItem> {
  // Agile Instance the Collection belongs to
  public agileInstance: () => Agile;

  public config: CollectionConfigInterface;
  private initialConfig: CreateCollectionConfigInterface;

  // Key/Name identifier of the Collection
  public _key?: CollectionKey;
  // Amount of the Items stored in the Collection
  public size = 0;
  // Items stored in the Collection
  public data: { [key: string]: Item<DataType> } = {};
  // Whether the Collection is persisted in an external Storage
  public isPersisted = false;
  // Manages the permanent persistent in external Storages
  public persistent: CollectionPersistent<DataType> | undefined;

  // Registered Groups of Collection
  public groups: { [key: string]: Group<DataType> } = {};
  // Registered Selectors of Collection
  public selectors: { [key: string]: Selector<DataType> } = {};

  // Whether the Collection was instantiated correctly
  public isInstantiated = false;

  /**
   * A Collection manages a reactive set of Information
   * that we need to remember globally at a later point in time.
   * While providing a toolkit to use and mutate this set of Information.
   *
   * It is designed for arrays of data objects following the same pattern.
   *
   * Each of these data object must have a unique `primaryKey` to be correctly identified later.
   *
   * You can create as many global Collections as you need.
   *
   * [Learn more..](https://agile-ts.org/docs/core/collection/)
   *
   * @public
   * @param agileInstance - Instance of Agile the Collection belongs to.
   * @param config - Configuration object
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

    this.isInstantiated = true;

    // Add 'initialData' to Collection
    // (after 'isInstantiated' to add them properly to the Collection)
    if (_config.initialData) this.collect(_config.initialData);

    // Reselect Selector Items
    // Necessary because the selection of an Item
    // hasn't worked with a not correctly 'instantiated' Collection before
    for (const key in this.selectors) this.selectors[key].reselect();

    // Rebuild of Groups
    // Not necessary because if Items are added to the Collection,
    // (after 'isInstantiated = true')
    // the Groups which contain these added Items are rebuilt.
    // for (const key in this.groups) this.groups[key].rebuild();
  }

  /**
   * Updates the key/name identifier of the Collection.
   *
   * [Learn more..](https://agile-ts.org/docs/core/collection/properties#key)
   *
   * @public
   * @param value - New key/name identifier.
   */
  public set key(value: CollectionKey | undefined) {
    this.setKey(value);
  }

  /**
   * Returns the key/name identifier of the Collection.
   *
   * [Learn more..](https://agile-ts.org/docs/core/collection/properties#key)
   *
   * @public
   */
  public get key(): CollectionKey | undefined {
    return this._key;
  }

  /**
   * Updates the key/name identifier of the Collection.
   *
   * [Learn more..](https://agile-ts.org/docs/core/collection/methods/#setkey)
   *
   * @public
   * @param value - New key/name identifier.
   */
  public setKey(value: CollectionKey | undefined) {
    const oldKey = this._key;

    // Update Collection key
    this._key = value;

    // Update key in Persistent (only if oldKey is equal to persistentKey
    // because otherwise the persistentKey is detached from the Collection key
    // -> not managed by Collection anymore)
    if (value && this.persistent?._key === oldKey)
      this.persistent?.setKey(value);

    return this;
  }

  /**
   * Creates a new Group without associating it to the Collection.
   *
   * This way of creating a Group is intended for use in the Collection configuration object,
   * where the `constructor()` takes care of the binding.
   *
   * After a successful initiation of the Collection we recommend using `createGroup()`,
   * because it automatically connects the Group to the Collection.
   *
   * [Learn more..](https://agile-ts.org/docs/core/collection/methods/#group)
   *
   * @public
   * @param initialItems - Key/Name identifiers of the Items to be clustered by the Group.
   * @param config - Configuration object
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

  /**
   * Creates a new Selector without associating it to the Collection.
   *
   * This way of creating a Selector is intended for use in the Collection configuration object,
   * where the `constructor()` takes care of the binding.
   *
   * After a successful initiation of the Collection we recommend using `createSelector()`,
   * because it automatically connects the Group to the Collection.
   *
   * [Learn more..](https://agile-ts.org/docs/core/collection/methods/#selector)
   *
   * @public
   * @param initialKey - Key/Name identifier of the Item to be represented by the Selector.
   * @param config - Configuration object
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

  /**
   * Sets up the specified Groups or Group keys
   * and assigns them to the Collection if they are valid.
   *
   * It also instantiates and assigns the default Group to the Collection.
   * The default Group reflects the default pattern of the Collection.
   *
   * @internal
   * @param groups - Entire Groups or Group keys to be set up.
   */
  public initGroups(groups: { [key: string]: Group<any> } | string[]): void {
    if (!groups) return;
    let groupsObject: { [key: string]: Group<DataType> } = {};

    // If groups is Array of Group keys/names, create the Groups based on these keys
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

    // Assign missing key/name to Group based on the property key
    for (const key in groupsObject)
      if (groupsObject[key]._key == null) groupsObject[key].setKey(key);

    this.groups = groupsObject;
  }

  /**
   * Sets up the specified Selectors or Selector keys
   * and assigns them to the Collection if they are valid.
   *
   * @internal
   * @param selectors - Entire Selectors or Selector keys to be set up.
   */
  public initSelectors(selectors: { [key: string]: Selector<any> } | string[]) {
    if (!selectors) return;
    let selectorsObject: { [key: string]: Selector<DataType> } = {};

    // If selectors is Array of Selector keys/names, create the Selectors based on these keys
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

    // Assign missing key/name to Selector based on the property key
    for (const key in selectorsObject)
      if (selectorsObject[key]._key == null) selectorsObject[key].setKey(key);

    this.selectors = selectorsObject;
  }

  /**
   * Appends new data objects following the same pattern to the end of the Collection.
   *
   * Each collected `data object` requires a unique identifier at the primaryKey property (by default 'id')
   * to be correctly identified later.
   *
   * For example, if we collect some kind of user object,
   * it must contain such unique identifier at 'id'
   * to be added to the Collection.
   * ```
   * MY_COLLECTION.collect({id: '1', name: 'jeff'}); // valid
   * MY_COLLECTION.collect({name: 'frank'}); // invalid
   * ```
   *
   * [Learn more..](https://agile-ts.org/docs/core/collection/methods/#collect)
   *
   * @public
   * @param data - Data objects or entire Items to be added.
   * @param groupKeys - Group/s to which the specified data objects or Items are to be added.
   * @param config - Configuration object
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

    // Add default groupKey, since all Items are added to the default Group
    if (!_groupKeys.includes(defaultGroupKey)) _groupKeys.push(defaultGroupKey);

    // Create not existing Groups
    _groupKeys.forEach(
      (key) => this.groups[key] == null && this.createGroup(key)
    );

    _data.forEach((data, index) => {
      let itemKey;
      let success = false;

      // Assign Data or Item to Collection
      if (data instanceof Item) {
        success = this.assignItem(data, {
          background: config.background,
        });
        itemKey = data._key;
      } else {
        success = this.assignData(data, {
          patch: config.patch,
          background: config.background,
        });
        itemKey = data[primaryKey];
      }

      // Add itemKey to provided Groups and create corresponding Selector
      if (success) {
        _groupKeys.forEach((groupKey) => {
          this.getGroup(groupKey)?.add(itemKey, {
            method: config.method,
            background: config.background,
          });
        });

        if (config.select) this.createSelector(itemKey, itemKey);
      }

      if (config.forEachItem) config.forEachItem(data, itemKey, success, index);
    });

    return this;
  }

  /**
   * Updates the Item `data object` with the specified `object with changes`, if the Item exists.
   * By default the `object with changes` is merged into the Item `data object` at top level.
   *
   * [Learn more..](https://agile-ts.org/docs/core/collection/methods/#update)
   *
   * @public
   * @param itemKey - Key/Name identifier of the Item to be updated.
   * @param changes - Object with changes to be merged into the Item data object.
   * @param config - Configuration object
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

    // Check if the given conditions are suitable for a update action
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

    // Update itemKey if the new itemKey differs from the old one
    if (oldItemKey !== newItemKey)
      this.updateItemKey(oldItemKey, newItemKey, {
        background: config.background,
      });

    // Patch changes into Item data object
    if (config.patch) {
      // Delete primaryKey property from 'changes object' because if it has changed,
      // it is correctly updated in the above called 'updateItemKey()' method
      if (changes[primaryKey]) delete changes[primaryKey];

      let patchConfig: { addNewProperties?: boolean } =
        typeof config.patch === 'object' ? config.patch : {};
      patchConfig = defineConfig(patchConfig, {
        addNewProperties: true,
      });

      item.patch(changes as any, {
        background: config.background,
        addNewProperties: patchConfig.addNewProperties,
      });
    }
    // Apply changes to Item data object
    else {
      // Ensure that the current Item identifier isn't different from the 'changes object' itemKey
      if (changes[this.config.primaryKey] !== itemKey) {
        changes[this.config.primaryKey] = itemKey;
        LogCodeManager.log('1B:02:02', [], changes);
      }

      item.set(changes as any, {
        background: config.background,
      });
    }

    return item;
  }

  /**
   * Creates a new Group and associates it to the Collection.
   *
   * [Learn more..](https://agile-ts.org/docs/core/collection/methods/#createGroup)
   *
   * @public
   * @param groupKey - Unique identifier of the Group to be created.
   * @param initialItems - Key/Name identifiers of the Items to be clustered by the Group.
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

    // Create new Group
    group = new Group<DataType>(this, initialItems, { key: groupKey });
    this.groups[groupKey] = group;

    return group;
  }

  /**
   * Returns a boolean indicating whether a Group with the specified `groupKey`
   * exists in the Collection or not.
   *
   * [Learn more..](https://agile-ts.org/docs/core/collection/methods/#hasgroup)
   *
   * @public
   * @param groupKey - Key/Name identifier of the Group to be checked for existence.
   * @param config - Configuration object
   */
  public hasGroup(
    groupKey: GroupKey | undefined,
    config: HasConfigInterface = {}
  ): boolean {
    return !!this.getGroup(groupKey, config);
  }

  /**
   * Retrieves a single Group with the specified key/name identifier from the Collection.
   *
   * If the to retrieve Group doesn't exist, `undefined` is returned.
   *
   * [Learn more..](https://agile-ts.org/docs/core/collection/methods/#getgroup)
   *
   * @public
   * @param groupKey - Key/Name identifier of the Group.
   * @param config - Configuration object
   */
  public getGroup(
    groupKey: GroupKey | undefined,
    config: HasConfigInterface = {}
  ): Group<DataType> | undefined {
    config = defineConfig(config, {
      notExisting: false,
    });

    // Retrieve Group
    const group = groupKey ? this.groups[groupKey] : undefined;

    // Check if retrieved Group exists
    if (group == null || (!config.notExisting && !group.exists))
      return undefined;

    ComputedTracker.tracked(group.observer);
    return group;
  }

  /**
   * Retrieves the default Group from the Collection.
   *
   * Every Collection should have a default Group,
   * which represents the default pattern of the Collection.
   *
   * If the default Group, for what ever reason, doesn't exist, `undefined` is returned.
   *
   * [Learn more..](https://agile-ts.org/docs/core/collection/methods/#getdefaultgroup)
   *
   * @public
   */
  public getDefaultGroup(): Group<DataType> | undefined {
    return this.getGroup(this.config.defaultGroupKey);
  }

  /**
   * Retrieves a single Group with the specified key/name identifier from the Collection.
   *
   * If the to retrieve Group doesn't exist, a reference Group is returned.
   * This has the advantage that Components that have the reference Group bound to themselves
   * are rerenderd when the original Group is created.
   *
   * [Learn more..](https://agile-ts.org/docs/core/collection/methods/#getgroupwithreference)
   *
   * @public
   * @param groupKey - Key/Name identifier of the Group.
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

  /**
   * Removes a Group with the specified key/name identifier from the Collection,
   * if it exists in the Collection.
   *
   * [Learn more..](https://agile-ts.org/docs/core/collection/methods/#removegroup)
   *
   * @public
   * @param groupKey - Key/Name identifier of the Group to be removed.
   */
  public removeGroup(groupKey: GroupKey): this {
    if (this.groups[groupKey] != null) delete this.groups[groupKey];
    return this;
  }

  /**
   * Returns the count of registered Groups in the Collection.
   *
   * [Learn more..](https://agile-ts.org/docs/core/collection/methods/#getgroupcount)
   *
   * @public
   */
  public getGroupCount(): number {
    let size = 0;
    Object.keys(this.groups).map(() => size++);
    return size;
  }

  /**
   * Creates a new Selector and associates it to the Collection.
   *
   * [Learn more..](https://agile-ts.org/docs/core/collection/methods/#createSelector)
   *
   * @public
   * @param selectorKey - Unique identifier of the Selector to be created.
   * @param itemKey - Key/Name identifier of the Item to be represented by the Selector.
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

    // Create new Selector
    selector = new Selector<DataType>(this, itemKey, {
      key: selectorKey,
    });
    this.selectors[selectorKey] = selector;

    return selector;
  }

  /**
   * Creates a new Selector and associates it to the Collection.
   *
   * The specified `itemKey` is used as the unique identifier key of the new Selector.
   * ```
   * MY_COLLECTION.select('1');
   * // is equivalent to
   * MY_COLLECTION.createSelector('1', '1');
   * ```
   *
   * [Learn more..](https://agile-ts.org/docs/core/collection/methods/#select)
   *
   * @public
   * @param itemKey - Key/Name identifier of the Item to be represented by the Selector
   * and used as unique identifier of the Selector.
   */
  public select(itemKey: ItemKey): Selector<DataType> {
    return this.createSelector(itemKey, itemKey);
  }

  /**
   * Returns a boolean indicating whether a Selector with the specified `selectorKey`
   * exists in the Collection or not.
   *
   * [Learn more..](https://agile-ts.org/docs/core/collection/methods/#hasselector)
   *
   * @public
   * @param selectorKey - Key/Name identifier of the Selector to be checked for existence.
   * @param config - Configuration object
   */
  public hasSelector(
    selectorKey: SelectorKey | undefined,
    config: HasConfigInterface = {}
  ): boolean {
    return !!this.getSelector(selectorKey, config);
  }

  /**
   * Retrieves a single Selector with the specified key/name identifier from the Collection.
   *
   * If the to retrieve Selector doesn't exist, `undefined` is returned.
   *
   * [Learn more..](https://agile-ts.org/docs/core/collection/methods/#getselector)
   *
   * @public
   * @param selectorKey - Key/Name identifier of the Selector.
   * @param config - Configuration object
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
    if (selector == null || (!config.notExisting && !selector.exists))
      return undefined;

    ComputedTracker.tracked(selector.observer);
    return selector;
  }

  /**
   * Retrieves a single Selector with the specified key/name identifier from the Collection.
   *
   * If the to retrieve Selector doesn't exist, a reference Selector is returned.
   * This has the advantage that Components that have the reference Selector bound to themselves
   * are rerenderd when the original Selector is created.
   *
   * [Learn more..](https://agile-ts.org/docs/core/collection/methods/#getselectorwithreference)
   *
   * @public
   * @param selectorKey - Key/Name identifier of the Selector.
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

  /**
   * Removes a Selector with the specified key/name identifier from the Collection,
   * if it exists in the Collection.
   *
   * [Learn more..](https://agile-ts.org/docs/core/collection/methods/#removeselector)
   *
   * @public
   * @param selectorKey - Key/Name identifier of the Selector to be removed.
   */
  public removeSelector(selectorKey: SelectorKey): this {
    if (this.selectors[selectorKey] != null) {
      this.selectors[selectorKey].unselect();
      delete this.selectors[selectorKey];
    }
    return this;
  }

  /**
   * Returns the count of registered Selectors in the Collection.
   *
   * [Learn more..](https://agile-ts.org/docs/core/collection/methods/#getselectorcount)
   *
   * @public
   */
  public getSelectorCount(): number {
    let size = 0;
    Object.keys(this.selectors).map(() => size++);
    return size;
  }

  /**
   * Returns a boolean indicating whether a Item with the specified `itemKey`
   * exists in the Collection or not.
   *
   * [Learn more..](https://agile-ts.org/docs/core/collection/methods/#hasitem)
   *
   * @public
   * @param itemKey - Key/Name identifier of the Item.
   * @param config - Configuration object
   */
  public hasItem(
    itemKey: ItemKey | undefined,
    config: HasConfigInterface = {}
  ): boolean {
    return !!this.getItem(itemKey, config);
  }

  /**
   * Retrieves a single Item with the specified key/name identifier from the Collection.
   *
   * If the to retrieve Item doesn't exist, `undefined` is returned.
   *
   * [Learn more..](https://agile-ts.org/docs/core/collection/methods/#getitem)
   *
   * @public
   * @param itemKey - Key/Name identifier of the Item.
   * @param config - Configuration object
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
   * Retrieves a single Item with the specified key/name identifier from the Collection.
   *
   * If the to retrieve Item doesn't exist, a reference Item is returned.
   * This has the advantage that Components that have the reference Item bound to themselves
   * are rerenderd when the original Item is created.
   *
   * [Learn more..](https://agile-ts.org/docs/core/collection/methods/#getitemwithreference)
   *
   * @public
   * @param itemKey - Key/Name identifier of the Item.
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
   * that can be used to hold a reference to a not existing Item.
   *
   * @internal
   * @param itemKey - Unique identifier of the to create placeholder Item.
   * @param addToCollection - Whether to add the Item to be created to the Collection.
   */
  public createPlaceholderItem(
    itemKey: ItemKey,
    addToCollection = false
  ): Item<DataType> {
    // Create placeholder Item
    const item = new Item<DataType>(
      this,
      {
        [this.config.primaryKey]: itemKey, // Setting primaryKey of the Item to passed itemKey
        dummy: 'item',
      } as any,
      { isPlaceholder: true }
    );

    // Add placeholder Item to Collection
    if (
      addToCollection &&
      !Object.prototype.hasOwnProperty.call(this.data, itemKey)
    )
      this.data[itemKey] = item;

    ComputedTracker.tracked(item.observer);
    return item;
  }

  /**
   * Retrieves the value (data object) of a single Item
   * with the specified key/name identifier from the Collection.
   *
   * If the to retrieve Item containing the value doesn't exist, `undefined` is returned.
   *
   * [Learn more..](https://agile-ts.org/docs/core/collection/methods/#getitemvalue)
   *
   * @public
   * @param itemKey - Key/Name identifier of the Item.
   * @param config - Configuration object
   */
  public getItemValue(
    itemKey: ItemKey | undefined,
    config: HasConfigInterface = {}
  ): DataType | undefined {
    const item = this.getItem(itemKey, config);
    if (item == null) return undefined;
    return item.value;
  }

  /**
   * Retrieves all Items from the Collection.
   * ```
   * MY_COLLECTION.getAllItems();
   * // is equivalent to
   * MY_COLLECTION.getDefaultGroup().items;
   * ```
   *
   * [Learn more..](https://agile-ts.org/docs/core/collection/methods/#getallitems)
   *
   * @public
   * @param config - Configuration object
   */
  public getAllItems(config: HasConfigInterface = {}): Array<Item<DataType>> {
    config = defineConfig(config, {
      notExisting: false,
    });

    const defaultGroup = this.getDefaultGroup();
    let items: Array<Item<DataType>> = [];

    // If config.notExisting transform the data object into array since it contains all Items,
    // otherwise return the default Group Items
    if (config.notExisting) {
      for (const key in this.data) items.push(this.data[key]);
    } else {
      // Why default Group Items and not all '.exists === true' Items?
      // Because the default Group keeps track of all existing Items.
      // It also does control the Collection output in binding methods like 'useAgile()'
      // and therefore should do it here too.
      items = defaultGroup?.items || [];
    }

    return items;
  }

  /**
   * Retrieves the values (data objects) of all Items from the Collection.
   * ```
   * MY_COLLECTION.getAllItemValues();
   * // is equivalent to
   * MY_COLLECTION.getDefaultGroup().output;
   * ```
   *
   * [Learn more..](https://agile-ts.org/docs/core/collection/methods/#getallitemvalues)
   *
   * @public
   * @param config - Configuration object
   */
  public getAllItemValues(config: HasConfigInterface = {}): Array<DataType> {
    const items = this.getAllItems(config);
    return items.map((item) => item.value);
  }

  /**
   * Preserves the Collection `value` in the corresponding external Storage.
   *
   * The Collection key/name is used as the unique identifier for the Persistent.
   * If that is not desired or the Collection has no unique identifier,
   * please specify a separate unique identifier for the Persistent.
   *
   * [Learn more..](https://agile-ts.org/docs/core/collection/methods/#persist)
   *
   * @public
   * @param config - Configuration object
   */
  public persist(config?: CollectionPersistentConfigInterface): this;
  /**
   * Preserves the Collection `value` in the corresponding external Storage.
   *
   * The specified key is used as the unique identifier for the Persistent.
   *
   * [Learn more..](https://agile-ts.org/docs/core/collection/methods/#persist)
   *
   * @public
   * @param key - Key/Name identifier of Persistent.
   * @param config - Configuration object
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

    // Create Persistent (-> persist value)
    this.persistent = new CollectionPersistent<DataType>(this, {
      instantiate: _config.loadValue,
      storageKeys: _config.storageKeys,
      key: key,
      defaultStorageKey: _config.defaultStorageKey,
    });

    return this;
  }

  /**
   * Fires immediately after the persisted `value`
   * is loaded into the Collection from a corresponding external Storage.
   *
   * Registering such callback function makes only sense
   * when the Collection is [persisted](https://agile-ts.org/docs/core/collection/methods/#persist) in an external Storage.
   *
   * [Learn more..](https://agile-ts.org/docs/core/collection/methods/#onload)
   *
   * @public
   * @param callback - A function to be executed after the externally persisted `value` was loaded into the Collection.
   */
  public onLoad(callback: (success: boolean) => void): this {
    if (!this.persistent) return this;
    if (!isFunction(callback)) {
      LogCodeManager.log('00:03:01', ['OnLoad Callback', 'function']);
      return this;
    }

    // Register specified callback
    this.persistent.onLoad = callback;

    // If Collection is already persisted ('isPersisted') fire specified callback immediately
    if (this.isPersisted) callback(true);

    return this;
  }

  /**
   * Removes all Items from the Collection
   * and resets all Groups and Selectors of the Collection.
   *
   * [Learn more..](https://agile-ts.org/docs/core/collection/methods/#reset)
   *
   * @public
   */
  public reset(): this {
    // Reset data
    this.data = {};
    this.size = 0;

    // Reset Groups
    for (const key in this.groups) this.getGroup(key)?.reset();

    // Reset Selectors
    for (const key in this.selectors) this.getSelector(key)?.reset();

    return this;
  }

  /**
   * Puts `itemKeys/s` into Group/s.
   *
   * [Learn more..](https://agile-ts.org/docs/core/collection/methods/#put)
   *
   * @public
   * @param itemKeys - `itemKey/s` to be put into the specified Group/s.
   * @param groupKeys - Key/Name Identifier/s of the Group/s the specified `itemKey/s` are to put in.
   * @param config - Configuration object
   */
  public put(
    itemKeys: ItemKey | Array<ItemKey>,
    groupKeys: GroupKey | Array<GroupKey>,
    config: GroupAddConfigInterface = {}
  ): this {
    const _itemKeys = normalizeArray(itemKeys);
    const _groupKeys = normalizeArray(groupKeys);

    // Assign itemKeys to Groups
    _groupKeys.forEach((groupKey) => {
      this.getGroup(groupKey)?.add(_itemKeys, config);
    });

    return this;
  }

  /**
   * Moves specified `itemKey/s` from one Group to another Group.
   *
   * [Learn more..](https://agile-ts.org/docs/core/collection/methods/#move)
   *
   * @public
   * @param itemKeys - `itemKey/s` to be moved.
   * @param oldGroupKey - Key/Name Identifier of the Group the `itemKey/s` are moved from.
   * @param newGroupKey - Key/Name Identifier of the Group the `itemKey/s` are moved in.
   * @param config - Configuration object
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

    // Assign itemKeys to new Group
    this.getGroup(newGroupKey)?.add(_itemKeys, config);

    return this;
  }

  /**
   * Updates key/name identifier of the Item
   * and returns a boolean indicating
   * whether the Item identifier was updated successfully.
   *
   * @internal
   * @param oldItemKey - Old key/name Item identifier.
   * @param newItemKey - New key/name Item identifier.
   * @param config - Configuration object
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

    // Update itemKey in data object
    delete this.data[oldItemKey];
    this.data[newItemKey] = item;

    // Update key/name of the Item
    item.setKey(newItemKey, {
      background: config.background,
    });

    // Update Persistent key of the Item if it follows the Item Storage Key pattern
    // and therefore differs from the actual Item key
    // (-> isn't automatically updated when the Item key is updated)
    if (
      item.persistent != null &&
      item.persistent._key ===
        CollectionPersistent.getItemStorageKey(oldItemKey, this._key)
    )
      item.persistent?.setKey(
        CollectionPersistent.getItemStorageKey(newItemKey, this._key)
      );

    // Update itemKey in Groups
    for (const groupKey in this.groups) {
      const group = this.getGroup(groupKey, { notExisting: true });
      if (group == null || !group.has(oldItemKey)) continue;
      group.replace(oldItemKey, newItemKey, { background: config.background });
    }

    // Update itemKey in Selectors
    for (const selectorKey in this.selectors) {
      const selector = this.getSelector(selectorKey, { notExisting: true });
      if (selector == null) continue;

      // Reselect Item in Selector that has selected the newItemKey.
      // Necessary because potential reference placeholder Item got overwritten
      // with the new (renamed) Item
      // -> has to find the new Item at selected itemKey
      //    since the placeholder Item got overwritten
      if (selector.hasSelected(newItemKey, false)) {
        selector.reselect({
          force: true, // Because itemKeys are the same (but not the Items at this itemKey anymore)
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

  /**
   * Returns all key/name identifiers of the Group/s containing the specified `itemKey`.
   *
   * [Learn more..](https://agile-ts.org/docs/core/collection/methods/#getgroupkeysthathaveitemkey)
   *
   * @public
   * @param itemKey - `itemKey` to be contained in Group/s.
   */
  public getGroupKeysThatHaveItemKey(itemKey: ItemKey): Array<GroupKey> {
    const groupKeys: Array<GroupKey> = [];
    for (const groupKey in this.groups) {
      const group = this.groups[groupKey];
      if (group?.has(itemKey)) groupKeys.push(groupKey);
    }
    return groupKeys;
  }

  /**
   * Removes Item/s from:
   *
   * - `.everywhere()`:
   *    Removes Item/s from the entire Collection and all its Groups and Selectors (i.e. from everywhere)
   *    ```
   *    MY_COLLECTION.remove('1').everywhere();
   *    // is equivalent to
   *    MY_COLLECTION.removeItems('1');
   *    ```
   * - `.fromGroups()`:
   *   Removes Item/s only from specified Groups.
   *   ```
   *    MY_COLLECTION.remove('1').fromGroups(['1', '2']);
   *    // is equivalent to
   *    MY_COLLECTION.removeFromGroups('1', ['1', '2']);
   *    ```
   *
   * [Learn more..](https://agile-ts.org/docs/core/collection/methods/#remove)
   *
   * @public
   * @param itemKeys - Item/s with identifier/s to be removed.
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

  /**
   * Remove Item/s from specified Group/s.
   *
   * [Learn more..](https://agile-ts.org/docs/core/collection/methods/#removefromgroups)
   *
   * @public
   * @param itemKeys - Key/Name Identifier/s of the Item/s to be removed from the Group/s.
   * @param groupKeys - Key/Name Identifier/s of the Group/s the Item/s are to remove from.
   */
  public removeFromGroups(
    itemKeys: ItemKey | Array<ItemKey>,
    groupKeys: GroupKey | Array<GroupKey>
  ): this {
    const _itemKeys = normalizeArray(itemKeys);
    const _groupKeys = normalizeArray(groupKeys);

    _itemKeys.forEach((itemKey) => {
      let removedFromGroupsCount = 0;

      // Remove itemKey from the Groups
      _groupKeys.forEach((groupKey) => {
        const group = this.getGroup(groupKey, { notExisting: true });
        if (!group?.has(itemKey)) return;
        group.remove(itemKey);
        removedFromGroupsCount++;
      });

      // If the Item was removed from each Group representing the Item,
      // remove it completely
      if (
        removedFromGroupsCount >=
        this.getGroupKeysThatHaveItemKey(itemKey).length
      )
        this.removeItems(itemKey);
    });

    return this;
  }

  /**
   * Removes Item/s from the entire Collection and all the Collection's Groups and Selectors.
   *
   * [Learn more..](https://agile-ts.org/docs/core/collection/methods/#removeitems)
   *
   * @public
   * @param itemKeys - Key/Name identifier/s of the Item/s to be removed from the entire Collection.
   * @param config - Configuration object
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

      // Remove Item from the Groups
      for (const groupKey in this.groups) {
        const group = this.getGroup(groupKey, { notExisting: true });
        if (group?.has(itemKey)) group?.remove(itemKey);
      }

      // Remove Item from Storage
      item.persistent?.removePersistedValue();

      // Remove Item from Collection
      delete this.data[itemKey];

      // Reselect or remove Selectors which have represented the removed Item
      for (const selectorKey in this.selectors) {
        const selector = this.getSelector(selectorKey, { notExisting: true });
        if (selector != null && selector.hasSelected(itemKey, false)) {
          if (config.removeSelector) {
            // Remove Selector
            this.removeSelector(selector._key ?? 'unknown');
          } else {
            // Reselect Item in Selector
            // in order to create a new dummyItem
            // to hold a reference to the now not existing Item
            selector.reselect({ force: true });
          }
        }
      }

      if (!wasPlaceholder) this.size--;
    });

    return this;
  }

  /**
   * Assigns the provided `data` object to an already existing Item
   * with specified key/name identifier found in the `data` object.
   * If the Item doesn't exist yet, a new Item with the `data` object as value
   * is created and assigned to the Collection.
   *
   * Returns a boolean indicating
   * whether the `data` object was assigned/updated successfully.
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

    // Check if data object contains valid itemKey,
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
    // (-> hasn't officially existed in Collection before)
    if (wasPlaceholder) this.size++;

    return true;
  }

  /**
   * Assigns the specified Item to the Collection
   * at the key/name identifier of the Item.
   *
   * And returns a boolean indicating
   * whether the Item was assigned successfully.
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

    // Check if Item has valid itemKey,
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
    // after adding Item with itemKey to the Collection
    // (because otherwise it can't find the Item as it isn't added yet)
    this.rebuildGroupsThatIncludeItemKey(itemKey, {
      background: config.background,
    });

    if (increaseCollectionSize) this.size++;

    return true;
  }

  /**
   * Rebuilds all Groups that contain the specified `itemKey`.
   *
   * @internal
   * @itemKey - `itemKey` Groups must contain to be rebuilt.
   * @config - Configuration object
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

    // Rebuild Groups that include itemKey
    for (const groupKey in this.groups) {
      const group = this.getGroup(groupKey);
      if (group?.has(itemKey)) {
        // Not necessary because a sideEffect of ingesting the Group
        // into the runtime is to rebuilt itself
        // group.rebuild();

        group?.ingest({
          background: config?.background,
          force: true, // because Group value didn't change, only the output might change
          sideEffects: config?.sideEffects,
          storage: false, // because Group only rebuilds (-> actual persisted value hasn't changed)
        });
      }
    }
  }
}

export type DefaultItem = Record<string, any>; // same as { [key: string]: any };
export type CollectionKey = string | number;
export type ItemKey = string | number;

export interface CreateCollectionConfigInterface<DataType = DefaultItem> {
  /**
   * Initial Groups of the Collection.
   * @default []
   */
  groups?: { [key: string]: Group<any> } | string[];
  /**
   * Initial Selectors of the Collection
   * @default []
   */
  selectors?: { [key: string]: Selector<any> } | string[];
  /**
   * Key/Name identifier of the Collection.
   * @default undefined
   */
  key?: CollectionKey;
  /**
   * Key/Name of the property
   * which represents the unique Item identifier
   * in collected data objects.
   * @default 'id'
   */
  primaryKey?: string;
  /**
   * Key/Name identifier of the default Group that is created shortly after instantiation.
   * The default Group represents the default pattern of the Collection.
   * @default 'default'
   */
  defaultGroupKey?: GroupKey;
  /**
   * Initial data objects of the Collection.
   * @default []
   */
  initialData?: Array<DataType>;
}

export type CollectionConfig<DataType extends Object = DefaultItem> =
  | CreateCollectionConfigInterface<DataType>
  | ((
      collection: Collection<DataType>
    ) => CreateCollectionConfigInterface<DataType>);

export interface CollectionConfigInterface {
  /**
   * Key/Name of the property
   * which represents the unique Item identifier
   * in collected data objects.
   * @default 'id'
   */
  primaryKey: string;
  /**
   * Key/Name identifier of the default Group that is created shortly after instantiation.
   * The default Group represents the default pattern of the Collection.
   * @default 'default'
   */
  defaultGroupKey: ItemKey;
}

export interface CollectConfigInterface<DataType = any>
  extends AssignDataConfigInterface {
  /**
   * In which way the collected data should be added to the Collection.
   * - 'push' =  at the end
   * - 'unshift' = at the beginning
   * https://www.tutorialspoint.com/what-are-the-differences-between-unshift-and-push-methods-in-javascript
   * @default 'push'
   */
  method?: 'push' | 'unshift';
  /**
   * Performs the specified action for each collected data object.
   * @default undefined
   */
  forEachItem?: (
    data: DataType | Item<DataType>,
    key: ItemKey,
    success: boolean,
    index: number
  ) => void;
  /**
   * Whether to create a Selector for each collected data object.
   * @default false
   */
  select?: boolean;
}

export interface UpdateConfigInterface {
  /**
   * Whether to merge the data object with changes into the existing Item data object
   * or overwrite the existing Item data object entirely.
   * @default true
   */
  patch?: boolean | PatchOptionConfigInterface;
  /**
   * Whether to update the data object in background.
   * So that the UI isn't notified of these changes and thus doesn't rerender.
   * @default false
   */
  background?: boolean;
}

export interface UpdateItemKeyConfigInterface {
  /**
   * Whether to update the Item key/name identifier in background
   * So that the UI isn't notified of these changes and thus doesn't rerender.
   * @default false
   */
  background?: boolean;
}

export interface RebuildGroupsThatIncludeItemKeyConfigInterface {
  /**
   * Whether to rebuilt the Group in background.
   * So that the UI isn't notified of these changes and thus doesn't rerender.
   * @default false
   */
  background?: boolean;
  /**
   * Whether to execute the defined side effects.
   * @default true
   */
  sideEffects?: SideEffectConfigInterface;
}

export interface HasConfigInterface {
  /**
   * Whether Items that do not officially exist,
   * such as placeholder Items, can be found
   * @default true
   */
  notExisting?: boolean;
}

export interface CollectionPersistentConfigInterface {
  /**
   * Whether the Persistent should automatically load
   * the persisted value into the Collection after its instantiation.
   * @default true
   */
  loadValue?: boolean;
  /**
   * Key/Name identifier of Storages
   * in which the Collection value should be or is persisted.
   * @default [AgileTs default Storage key]
   */
  storageKeys?: StorageKey[];
  /**
   * Default Storage key of the specified Storage keys.
   * The Collection value is loaded from the default Storage
   * and is only loaded from the remaining Storages (storageKeys)
   * if the loading of the default Storage failed.
   * @default first index of the specified Storage keys or the AgileTs default Storage key
   */
  defaultStorageKey?: StorageKey;
}

export interface RemoveItemsConfigInterface {
  /**
   * Whether to remove not officially existing Items (such as placeholder Items).
   * Keep in mind that sometimes it won't remove an Item entirely
   * as another Instance (like a Selector) might need to keep reference to it.
   * https://github.com/agile-ts/agile/pull/152
   * @default false
   */
  notExisting?: boolean;
  /**
   * Whether to remove Selectors that have selected an Item to be removed.
   * @default false
   */
  removeSelector?: boolean;
}

export interface AssignDataConfigInterface {
  /**
   * When the Item identifier of the to assign data object already exists in the Collection,
   * whether to merge the newly assigned data into the existing one
   * or overwrite the existing one entirely.
   * @default true
   */
  patch?: boolean;
  /**
   * Whether to assign the data object to the Collection in background.
   * So that the UI isn't notified of these changes and thus doesn't rerender.
   * @default false
   */
  background?: boolean;
}

export interface AssignItemConfigInterface {
  /**
   * If an Item with the Item identifier already exists,
   * whether to overwrite it entirely with the new one.
   * @default false
   */
  overwrite?: boolean;
  /**
   * Whether to assign the Item to the Collection in background.
   * So that the UI isn't notified of these changes and thus doesn't rerender.
   * @default false
   */
  background?: boolean;
}
