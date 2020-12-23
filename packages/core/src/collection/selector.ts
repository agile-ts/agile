import {
  Agile,
  Collection,
  DefaultItem,
  defineConfig,
  Item,
  ItemKey,
  State,
  StateRuntimeJobConfigInterface,
} from "../internal";

export class Selector<DataType = DefaultItem> extends State<
  DataType | undefined
> {
  static rebuildSelectorSideEffectKey = "rebuildSelector";
  public collection: () => Collection<DataType>;
  public item: Item<DataType> | undefined;
  public _itemKey: ItemKey; // Key of Item the Selector represents

  /**
   * @public
   * Represents Item of Collection
   * @param collection - Collection that contains the Item
   * @param itemKey - ItemKey of Item that the Selector represents
   * @param config - Config
   */
  constructor(
    collection: Collection<DataType>,
    itemKey: ItemKey,
    config: SelectorConfigInterface = {}
  ) {
    super(collection.agileInstance(), undefined, config);
    config = defineConfig(config, {
      isPlaceholder: false,
    });

    this.collection = () => collection;
    this.item = undefined;
    this._itemKey = "unknown";
    this._key = config?.key;
    this.isPlaceholder = true;

    // Initial Select
    if (!config.isPlaceholder) this.select(itemKey, { overwrite: true });
  }

  /**
   * @public
   * Set ItemKey that the Selector represents
   */
  public set itemKey(value: ItemKey) {
    this.select(value);
  }

  /**
   * @public
   * Get ItemKey that the Selector represents
   */
  public get itemKey() {
    return this._itemKey;
  }

  /**
   * @public
   * Select new ItemKey
   * @param itemKey - New ItemKey
   * @param config - Config
   */
  public select(
    itemKey: ItemKey,
    config: StateRuntimeJobConfigInterface = {}
  ): this {
    const oldItem = this.item;
    let newItem = this.collection().getItemWithReference(itemKey);
    config = defineConfig(config, {
      background: false,
      sideEffects: true,
      force: false,
      overwrite: oldItem?.isPlaceholder || false,
      storage: true,
    });

    if (this._itemKey === itemKey && !config.force) {
      Agile.logger.warn(`Selector has already selected '${itemKey}'!`);
      return this;
    }

    // Remove old Item from Collection if it is an Placeholder
    if (oldItem?.isPlaceholder) delete this.collection().data[this._itemKey];

    // Remove Selector sideEffect from old Item
    oldItem?.removeSideEffect(Selector.rebuildSelectorSideEffectKey);

    this._itemKey = itemKey;
    this.item = newItem;

    // Add SideEffect to newItem, that rebuild this Selector depending on the current Item Value
    newItem.addSideEffect(Selector.rebuildSelectorSideEffectKey, (config) =>
      this.rebuildSelector(config)
    );

    // Rebuild Selector for instantiating new 'selected' ItemKey properly
    this.rebuildSelector({
      background: config.background,
      sideEffects: config.sideEffects,
      force: config.force,
      overwrite: config.overwrite,
    });

    return this;
  }

  //=========================================================================================================
  // RebuildSelector
  //=========================================================================================================
  /**
   * @public
   * Rebuilds Selector
   * @param config - Config
   */
  public rebuildSelector(config: StateRuntimeJobConfigInterface = {}) {
    // Set Selector Value to undefined if Item doesn't exist
    if (!this.item || this.item.isPlaceholder) {
      this.set(undefined, config);
      return;
    }

    // Set Selector Value to updated Item Value
    this.set(this.item._value, config);
  }
}

export type SelectorKey = string | number;

/**
 * @param key - Key/Name of Selector
 * @param isPlaceholder - If Selector is initially a Placeholder
 */
export interface SelectorConfigInterface {
  key?: SelectorKey;
  isPlaceholder?: boolean;
}
