import {
  Agile,
  State,
  Collection,
  DefaultItem,
  ItemKey,
  defineConfig,
  normalizeArray,
  Item,
  copy,
  CollectionPersistent,
  StatePersistentConfigInterface,
  isValidObject,
  PersistentKey,
  ComputedTracker,
  StateRuntimeJobConfigInterface,
} from '../internal';

export class Group<DataType = DefaultItem> extends State<Array<ItemKey>> {
  static rebuildGroupSideEffectKey = 'rebuildGroup';
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
    config: GroupConfigInterface = {}
  ) {
    super(collection.agileInstance(), initialItems || [], config);
    this.collection = () => collection;

    // Add rebuild to sideEffects to rebuild Group on Value Change
    this.addSideEffect(Group.rebuildGroupSideEffectKey, () => this.rebuild());

    // Initial Rebuild
    this.rebuild();
  }

  /**
   * @public
   * Get Item Values of Group
   */
  public get output(): Array<DataType> {
    ComputedTracker.tracked(this.observer);
    return this._output;
  }

  /**
   * @public
   * Set Item Values of Group
   */
  public set output(value: DataType[]) {
    this._output = value;
  }

  /**
   * @public
   * Get Items of Group
   */
  public get items(): Array<Item<DataType>> {
    ComputedTracker.tracked(this.observer);
    return this._items.map((item) => item());
  }

  /**
   * @public
   * Set Items of Group
   */
  public set items(value: Array<Item<DataType>>) {
    this._items = value.map((item) => () => item);
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
    const notExistingItemKeysInCollection: Array<ItemKey> = [];
    const notExistingItemKeys: Array<ItemKey> = [];
    let newGroupValue = copy(this.nextStateValue);
    config = defineConfig(config, {
      background: false,
    });

    // Remove ItemKeys from Group
    _itemKeys.forEach((itemKey) => {
      // Check if itemKey exists in Group
      if (!newGroupValue.includes(itemKey)) {
        Agile.logger.error(
          `Couldn't find ItemKey '${itemKey}' in Group '${this._key}'!`
        );
        notExistingItemKeys.push(itemKey);
        notExistingItemKeysInCollection.push(itemKey);
        return;
      }

      // Check if ItemKey exists in Collection
      if (!this.collection().getItem(itemKey))
        notExistingItemKeysInCollection.push(itemKey);

      // Remove ItemKey from Group
      newGroupValue = newGroupValue.filter((key) => key !== itemKey);
    });

    // Return if passed ItemKeys doesn't exist
    if (notExistingItemKeys.length >= _itemKeys.length) return this;

    // If all removed ItemKeys doesn't exist in Collection -> no rerender necessary since output doesn't change
    if (notExistingItemKeysInCollection.length >= _itemKeys.length)
      config.background = true;

    this.set(newGroupValue, { background: config.background });

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
    const notExistingItemKeysInCollection: Array<ItemKey> = [];
    const existingItemKeys: Array<ItemKey> = [];
    let newGroupValue = copy(this.nextStateValue);
    config = defineConfig<GroupAddConfig>(config, {
      method: 'push',
      overwrite: false,
      background: false,
    });

    // Add ItemKeys to Group
    _itemKeys.forEach((itemKey) => {
      const existsInGroup = newGroupValue.includes(itemKey);

      // Check if ItemKey exists in Collection
      if (!this.collection().getItem(itemKey))
        notExistingItemKeysInCollection.push(itemKey);

      // Remove ItemKey from Group if it should get overwritten and already exists
      if (existsInGroup) {
        if (config.overwrite) {
          newGroupValue = newGroupValue.filter((key) => key !== itemKey);
        } else {
          existingItemKeys.push(itemKey);
          return;
        }
      }

      // Add new ItemKey to Group
      newGroupValue[config.method || 'push'](itemKey);
    });

    // Return if passed ItemKeys already exist
    if (existingItemKeys.length >= _itemKeys.length) return this;

    // If all added ItemKeys doesn't exist in Collection or already exist -> no rerender necessary since output doesn't change
    if (
      notExistingItemKeysInCollection.concat(existingItemKeys).length >=
      _itemKeys.length
    )
      config.background = true;

    this.set(newGroupValue, { background: config.background });

    return this;
  }

  //=========================================================================================================
  // Replace
  //=========================================================================================================
  /**
   * @public
   * Replaces oldItemKey with newItemKey
   * @param oldItemKey - Old ItemKey
   * @param newItemKey - New ItemKey
   * @param config - Config
   */
  public replace(
    oldItemKey: ItemKey,
    newItemKey: ItemKey,
    config: StateRuntimeJobConfigInterface = {}
  ): this {
    const newGroupValue = copy(this._value);
    newGroupValue.splice(newGroupValue.indexOf(oldItemKey), 1, newItemKey);
    this.set(newGroupValue, config);
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
   * @param key - Key/Name of created Persistent (Note: Key required if Group has no set Key!)
   * @param config - Config
   */
  public persist(
    key?: PersistentKey,
    config?: GroupPersistConfigInterface
  ): this;
  public persist(
    keyOrConfig: PersistentKey | GroupPersistConfigInterface = {},
    config: GroupPersistConfigInterface = {}
  ): this {
    let _config: GroupPersistConfigInterface;
    let key: PersistentKey | undefined;

    if (isValidObject(keyOrConfig)) {
      _config = keyOrConfig as GroupPersistConfigInterface;
      key = this._key;
    } else {
      _config = config || {};
      key = keyOrConfig as PersistentKey;
    }

    _config = defineConfig(_config, {
      instantiate: true,
      followCollectionPattern: false,
      storageKeys: [],
    });

    if (_config.followCollectionPersistKeyPattern) {
      key = CollectionPersistent.getGroupStorageKey(
        key || this._key,
        this.collection()._key
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

    // Create groupItems by finding Item at ItemKey in Collection
    this._value.forEach((itemKey) => {
      const item = this.collection().getItem(itemKey);
      if (item) groupItems.push(item);
      else notFoundItemKeys.push(itemKey);
    });

    // Create groupOutput out of groupItems
    const groupOutput = groupItems.map((item) => {
      return item.getPublicValue();
    });

    // Logging
    if (notFoundItemKeys.length > 0) {
      Agile.logger.warn(
        `Couldn't find some Items in Collection '${this.collection()._key}' (${
          this._key
        })`,
        notFoundItemKeys
      );
    }

    this.items = groupItems;
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
  method?: 'unshift' | 'push';
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
 * @param isPlaceholder - If Group is initially a Placeholder
 */
export interface GroupConfigInterface {
  key?: GroupKey;
  isPlaceholder?: boolean;
}

/**
 * @param useCollectionPattern - If Group storageKey follows the Collection Group StorageKey Pattern
 */
export interface GroupPersistConfigInterface
  extends StatePersistentConfigInterface {
  followCollectionPersistKeyPattern?: boolean;
}
