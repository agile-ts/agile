import {
  Agile,
  State,
  Collection,
  DefaultItem,
  ItemKey,
  defineConfig,
  normalizeArray,
  Item,
} from "../internal";

export class Group<DataType = DefaultItem> extends State<Array<ItemKey>> {
  collection: () => Collection<DataType>;

  _output: Array<DataType> = []; // Output of Group
  _items: Array<() => Item<DataType>> = []; // Items of Group
  notFoundItemKeys: Array<ItemKey> = []; // Contains all key that can't be found in Collection

  /**
   * @public
   * Group - Holds Items of Collection
   * @param agileInstance - An instance of Agile
   * @param collection - Collection to which the Group belongs
   * @param initialItems - Initial ItemKeys of Group
   * @param config - Config
   */
  constructor(
    agileInstance: Agile,
    collection: Collection<DataType>,
    initialItems?: Array<ItemKey>,
    config?: GroupConfigInterface
  ) {
    super(agileInstance, initialItems || [], config?.key);
    this.collection = () => collection;

    // Add rebuild to sideEffects so that it rebuilds the Group Output if the value changes
    this.addSideEffect("buildGroup", () => this.rebuild());

    // Initial Build
    this.rebuild();
  }

  /**
   * @public
   * Get Item Value of Group
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
   * Check if Group contains itemKey
   * @param itemKey - ItemKey that gets checked if it exists in this Group
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
   * @param itemKeys - ItemKey/s that gets removed from Group
   * @param config - Config
   */
  public remove(
    itemKeys: ItemKey | ItemKey[],
    config: GroupRemoveConfig = {}
  ): this {
    const _itemKeys = normalizeArray<ItemKey>(itemKeys);
    const notExistingItemKeys: Array<ItemKey> = [];
    config = defineConfig(config, {
      background: false,
    });

    // Remove ItemKeys from Group
    _itemKeys.forEach((itemKey) => {
      // Check if itemKey exists in Group
      if (!this.nextStateValue.includes(itemKey)) {
        console.error(
          `Agile: Couldn't find itemKey '${itemKey}' in Group!`,
          this
        );
        return;
      }

      // Check if ItemKey exists in Collection
      if (!this.collection().findById(itemKey))
        notExistingItemKeys.push(itemKey);

      // Remove ItemKey from Group
      this.nextStateValue = this.nextStateValue.filter(
        (key) => key !== itemKey
      );
    });

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
   * @param itemKeys - ItemKey/s that gets added to Group
   * @param config - Config
   */
  public add(itemKeys: ItemKey | ItemKey[], config: GroupAddConfig = {}): this {
    const _itemKeys = normalizeArray<ItemKey>(itemKeys);
    const notExistingItemKeys: Array<ItemKey> = []; // ItemKeys that don't exist in Collection
    config = defineConfig<GroupAddConfig>(config, {
      method: "push",
      overwrite: false,
      background: false,
    });

    // Add ItemKeys to Group
    _itemKeys.forEach((itemKey) => {
      const existsInGroup = this.nextStateValue.includes(itemKey);

      // Check if ItemKey exists in Collection
      if (!this.collection().findById(itemKey))
        notExistingItemKeys.push(itemKey);

      // Remove ItemKey from Group if overwriting otherwise return
      if (existsInGroup) {
        if (config.overwrite)
          this.nextStateValue = this.nextStateValue.filter(
            (key) => key !== itemKey
          );
        else return;
      }

      // Add new ItemKey to Group
      this.nextStateValue[config.method || "push"](itemKey);
    });

    // If all added ItemKeys doesn't exist in Collection -> no rerender necessary since output doesn't change
    if (notExistingItemKeys.length >= _itemKeys.length)
      config.background = true;

    // Ingest nextStateValue into Runtime
    this.ingest({ background: config.background });

    return this;
  }

  //=========================================================================================================
  // Rebuild
  //=========================================================================================================
  /**
   * @internal
   * Rebuilds Output of Group
   */
  public rebuild() {
    const notFoundItemKeys: Array<ItemKey> = []; // Item Keys that couldn't be found in Collection
    const groupItems: Array<Item<DataType>> = [];
    let groupOutput: Array<DataType>;

    // Create groupItems by finding fitting Item to ItemKey in Collection
    this._value.forEach((itemKey) => {
      let data = this.collection().data[itemKey];
      if (data) groupItems.push(data);
      else notFoundItemKeys.push(itemKey);
    });

    // Create groupOutput with groupItems
    groupOutput = groupItems.map((item) => {
      return item.getPublicValue();
    });

    // Logging
    if (this.agileInstance().config.logJobs && notFoundItemKeys.length > 0)
      console.warn(
        `Agile: Couldn't find some Items in Collection '${this.key}'`,
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
 * @param overwrite - If adding ItemKey overwrites old ItemKey (-> gets added at the end of the Group)
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
