import {
  Agile,
  State,
  Collection,
  DefaultItem,
  ItemKey,
  defineConfig,
  normalizeArray,
} from "../internal";
import { updateGroup } from "./perstist";

export class Group<DataType = DefaultItem> extends State<Array<ItemKey>> {
  collection: () => Collection<DataType>;

  _output: Array<DataType> = []; // Output of the group (Note: _value are only the keys of the collection items)
  _states: Array<() => State<DataType>> = []; // States of the Group
  notFoundItemKeys: Array<ItemKey> = []; // Contains all key which can't be found in the collection

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

  public get output(): Array<DataType> {
    // Add state(group) to foundState (for auto tracking used states in computed functions)
    if (this.agileInstance().runtime.trackObservers)
      this.agileInstance().runtime.foundObservers.add(this.observer);

    return this._output;
  }

  public get states(): Array<State<DataType>> {
    // Add state(group) to foundState (for auto tracking used states in computed functions)
    if (this.agileInstance().runtime.trackObservers)
      this.agileInstance().runtime.foundObservers.add(this.observer);

    return this._states.map((state) => state());
  }

  //=========================================================================================================
  // Has
  //=========================================================================================================
  /**
   * Checks if the group contains the primaryKey
   */
  public has(primaryKey: ItemKey) {
    return this.value.findIndex((key) => key === primaryKey) !== -1;
  }

  //=========================================================================================================
  // Size
  //=========================================================================================================
  /**
   * Returns the size of the group
   */
  public get size(): number {
    return this.value.length;
  }

  //=========================================================================================================
  // Remove
  //=========================================================================================================
  /**
   * Removes a item at primaryKey from the group
   */
  public remove(
    itemKeys: ItemKey | ItemKey[],
    options: { background?: boolean } = {}
  ): this {
    const _itemKeys = normalizeArray<ItemKey>(itemKeys);
    const notExistingCollectionItems: Array<ItemKey> = [];

    // Merge default values into options
    options = defineConfig(options, {
      background: false,
    });

    _itemKeys.forEach((itemKey) => {
      // If item doesn't exist in collection add it to notExistingItems
      if (!this.collection().findById(itemKey))
        notExistingCollectionItems.push(itemKey);

      // Check if primaryKey exists in group if not, return
      if (this.value.findIndex((key) => key === itemKey) === -1) {
        console.error(
          `Agile: Couldn't find primaryKey '${itemKey}' in group`,
          this
        );
        return;
      }

      // Remove primaryKey from nextState
      this.nextStateValue = this.nextStateValue.filter((i) => i !== itemKey);

      // Storage
      if (this.key) updateGroup(this.key, this.collection());
    });

    // If all items don't exist in collection.. set background to true because the output won't change -> no rerender necessary
    if (notExistingCollectionItems.length >= _itemKeys.length)
      options.background = true;

    // Set State to nextState
    this.ingest(options);

    return this;
  }

  //=========================================================================================================
  // Add
  //=========================================================================================================
  /**
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
    const groupItems: Array<State<DataType>> = [];
    let groupOutput: Array<DataType>;

    // Create groupItems by finding fitting Item to ItemKey in Collection
    this._value.forEach((itemKey) => {
      let data = this.collection().data[itemKey];
      if (data) groupItems.push(data);
      else notFoundItemKeys.push(itemKey);
    });

    // Create groupOutput with groupItems
    groupOutput = groupItems.map((state) => {
      return state.getPublicValue();
    });

    // Logging
    if (this.agileInstance().config.logJobs && notFoundItemKeys.length > 0)
      console.warn(
        `Agile: Couldn't find some Items in Collection '${this.key}'`,
        notFoundItemKeys
      );

    this._states = groupItems.map((item) => () => item);
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
 * @param key - Key/Name of Group
 */
export interface GroupConfigInterface {
  key?: GroupKey;
}
