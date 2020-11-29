import {
  Agile,
  State,
  Collection,
  DefaultItem,
  ItemKey,
  defineConfig,
  normalizeArray,
  Item,
  StorageKey,
  copy,
  CollectionPersistent,
  isValidObject,
  StatePersistentConfigInterface,
} from "../internal";

export class Group<DataType = DefaultItem> extends State<Array<ItemKey>> {
  collection: () => Collection<DataType>;

  _output: Array<DataType> = []; // Output of Group
  _items: Array<() => Item<DataType>> = []; // Items of Group
  notFoundItemKeys: Array<ItemKey> = []; // Contains all keys of Group that can't be found in Collection

  /**
   * @public
   * Group - Holds Items of Collection
   * @param collection - Collection to that the Group belongs
   * @param initialItems - Initial Key of Items in this Group
   * @param config - Config
   */
  constructor(
    collection: Collection<DataType>,
    initialItems?: Array<ItemKey>,
    config?: GroupConfigInterface
  ) {
    super(collection.agileInstance(), initialItems || [], config?.key);
    this.collection = () => collection;

    // Add rebuild to sideEffects so that it rebuilds the Group Output if the value changes
    this.addSideEffect("buildGroup", () => this.rebuild());

    // Initial Build
    this.rebuild();
  }

  /**
   * @public
   * Get Item Values of Group
   */
  public get output(): Array<DataType> {
    // Add Group to tracked Observers (for auto tracking used observers in computed function)
    if (this.agileInstance().runtime.trackObservers)
      this.agileInstance().runtime.foundObservers.add(this.observer);

    return this._output;
  }

  /**
   * @public
   * Get Items of Group
   */
  public get items(): Array<Item<DataType>> {
    // Add Group to tracked Observers (for auto tracking used observers in computed function)
    if (this.agileInstance().runtime.trackObservers)
      this.agileInstance().runtime.foundObservers.add(this.observer);

    return this._items.map((item) => item());
  }

  //=========================================================================================================
  // Has
  //=========================================================================================================
  /**
   * @public
   * Checks if Group contains ItemKey
   * @param itemKey - ItemKey that gets checked
   */
  public has(itemKey: ItemKey) {
    return this.value.findIndex((key) => key === itemKey) !== -1;
  }

  //=========================================================================================================
  // Size
  //=========================================================================================================
  /**
   * @public
   * Get size of Group (-> How many Items it contains)
   */
  public get size(): number {
    return this.value.length;
  }

  //=========================================================================================================
  // Remove
  //=========================================================================================================
  /**
   * @public
   * Removes ItemKey/s from Group
   * @param itemKeys - ItemKey/s that get removed from Group
   * @param config - Config
   */
  public remove(
    itemKeys: ItemKey | ItemKey[],
    config: GroupRemoveConfig = {}
  ): this {
    const _itemKeys = normalizeArray<ItemKey>(itemKeys);
    const notExistingItemKeys: Array<ItemKey> = [];
    let newGroupValue = copy(this.nextStateValue); // Copying nextStateValue because somehow a reference exists between nextStateValue and value
    config = defineConfig(config, {
      background: false,
    });

    // Remove ItemKeys from Group
    _itemKeys.forEach((itemKey) => {
      // Check if itemKey exists in Group
      if (!newGroupValue.includes(itemKey)) {
        Agile.logger.error(
          `Couldn't find itemKey '${itemKey}' in Group!`,
          this
        );
        return;
      }

      // Check if ItemKey exists in Collection
      if (!this.collection().getItem(itemKey))
        notExistingItemKeys.push(itemKey);

      // Remove ItemKey from Group
      newGroupValue = newGroupValue.filter((key) => key !== itemKey);
    });
    this.nextStateValue = newGroupValue;

    // If all removed ItemKeys doesn't exist in Collection -> no rerender necessary since output doesn't change
    if (notExistingItemKeys.length >= _itemKeys.length)
      config.background = true;

    // Ingest nextStateValue into Runtime
    this.ingest({ background: config.background });

    return this;
  }

  //=========================================================================================================
  // Add
  //=========================================================================================================
  /**
   * @public
   * Adds ItemKey/s to Group
   * @param itemKeys - ItemKey/s that get added to the Group
   * @param config - Config
   */
  public add(itemKeys: ItemKey | ItemKey[], config: GroupAddConfig = {}): this {
    const _itemKeys = normalizeArray<ItemKey>(itemKeys);
    const notExistingItemKeys: Array<ItemKey> = []; // ItemKeys that don't exist in Collection
    let newGroupValue = copy(this.nextStateValue); // Copying nextStateValue because somehow a reference exists between nextStateValue and value
    config = defineConfig<GroupAddConfig>(config, {
      method: "push",
      overwrite: false,
      background: false,
    });

    // Add ItemKeys to Group
    _itemKeys.forEach((itemKey) => {
      const existsInGroup = newGroupValue.includes(itemKey);

      // Check if ItemKey exists in Collection
      if (!this.collection().getItem(itemKey))
        notExistingItemKeys.push(itemKey);

      // Remove ItemKey from Group if it should get overwritten and exists
      if (existsInGroup) {
        if (config.overwrite)
          newGroupValue = newGroupValue.filter((key) => key !== itemKey);
        else return;
      }

      // Add new ItemKey to Group
      newGroupValue[config.method || "push"](itemKey);
    });
    this.nextStateValue = newGroupValue;

    // If all added ItemKeys doesn't exist in Collection -> no rerender necessary since output doesn't change
    if (notExistingItemKeys.length >= _itemKeys.length)
      config.background = true;

    // Ingest nextStateValue into Runtime
    this.ingest({ background: config.background });

    return this;
  }

  //=========================================================================================================
  // Persist
  //=========================================================================================================
  /**
   * @public
   * Stores Group Value into Agile Storage permanently
   * @param config - Config
   */
  public persist(config?: GroupPersistConfigInterface): this;
  /**
   * @public
   * Stores Group Value into Agile Storage permanently
   * @param key - Storage Key (Note: not needed if Group has key/name)
   * @param config - Config
   */
  public persist(key?: StorageKey, config?: GroupPersistConfigInterface): this;
  public persist(
    keyOrConfig: StorageKey | GroupPersistConfigInterface = {},
    config: GroupPersistConfigInterface = {}
  ): this {
    let _config: GroupPersistConfigInterface;
    let key: StorageKey | undefined;

    if (isValidObject(keyOrConfig)) {
      _config = keyOrConfig as GroupPersistConfigInterface;
      key = undefined;
    } else {
      _config = config || {};
      key = keyOrConfig as StorageKey;
    }

    _config = defineConfig(_config, {
      instantiate: true,
      followCollectionPattern: false,
    });

    if (_config.followCollectionPattern) {
      key = CollectionPersistent.getGroupStorageKey(
        key || this.key,
        this.collection().key
      );
    }

    super.persist(key, {
      instantiate: _config.instantiate,
      storageKeys: _config.storageKeys,
    });

    return this;
  }

  //=========================================================================================================
  // Rebuild
  //=========================================================================================================
  /**
   * @internal
   * Rebuilds Output and Items of Group
   */
  public rebuild() {
    const notFoundItemKeys: Array<ItemKey> = []; // Item Keys that couldn't be found in Collection
    const groupItems: Array<Item<DataType>> = [];
    let groupOutput: Array<DataType>;

    // Create groupItems by finding Item at ItemKey in Collection
    this._value.forEach((itemKey) => {
      let data = this.collection().data[itemKey];
      if (data) groupItems.push(data);
      else notFoundItemKeys.push(itemKey);
    });

    // Create groupOutput out of groupItems
    groupOutput = groupItems.map((item) => {
      return item.getPublicValue();
    });

    // Logging
    if (notFoundItemKeys.length > 0)
      Agile.logger.warn(
        `Couldn't find some Items in Collection '${this.key}'`,
        notFoundItemKeys
      );

    this._items = groupItems.map((item) => () => item);
    this._output = groupOutput;
    this.notFoundItemKeys = notFoundItemKeys;
  }
}

export type GroupKey = string | number;

/**
 * @param method - Way of adding ItemKey to Group (push, unshift)
 * @param overwrite - If adding ItemKey overwrites old ItemKey (-> otherwise it gets added to the end of the Group)
 * @param background - If adding ItemKey happens in the background (-> not causing any rerender)
 */
export interface GroupAddConfig {
  method?: "unshift" | "push";
  overwrite?: boolean;
  background?: boolean;
}

/**
 * @param background - If removing ItemKey happens in the background (-> not causing any rerender)
 */
export interface GroupRemoveConfig {
  background?: boolean;
}

/**
 * @param key - Key/Name of Group
 */
export interface GroupConfigInterface {
  key?: GroupKey;
}

/**
 * @param useCollectionPattern - If Group storageKey follows the Collection Group StorageKey Pattern
 */
export interface GroupPersistConfigInterface
  extends StatePersistentConfigInterface {
  followCollectionPattern?: boolean;
}
