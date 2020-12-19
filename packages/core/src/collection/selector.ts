import {
  Agile,
  Collection,
  DefaultItem,
  defineConfig,
  Item,
  ItemKey,
  SetConfigInterface,
  State,
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
    config?: SelectorConfigInterface
  ) {
    super(collection.agileInstance(), undefined);
    this.collection = () => collection;
    this.item = undefined;
    this._itemKey = itemKey;
    this._key = config?.key;

    // Initial Select
    this.select(itemKey, { overwrite: true });
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
  public select(itemKey: ItemKey, config: SelectConfigInterface = {}): this {
    const oldItem = this.item;
    let newItem = this.collection().getItemWithReference(itemKey);
    config = defineConfig(config, {
      background: false,
      sideEffects: true,
      force: false,
      overwrite: oldItem?.isPlaceholder || false,
    });

    if (oldItem?._key === itemKey && !config.force) {
      Agile.logger.warn(`Selector has already selected '${itemKey}'!`);
      return this;
    }

    // Overwrite old Item Values with new Item Value
    if (config.overwrite) {
      this._value = newItem._value;
      this.nextStateValue = newItem._value;
      this.previousStateValue = newItem._value;
      this.initialStateValue = newItem._value;
      this.isSet = false;
    }

    // Remove old Item from Collection if it is an Placeholder
    if (oldItem?.isPlaceholder) delete this.collection().data[this._itemKey];

    // Remove Selector sideEffect from old Item
    oldItem?.removeSideEffect(Selector.rebuildSelectorSideEffectKey);

    this._itemKey = itemKey;
    this.item = newItem;

    // Add SideEffect to newItem, that rebuild this Selector depending on the current Item Value
    newItem.addSideEffect(Selector.rebuildSelectorSideEffectKey, () =>
      this.rebuildSelector(config)
    );

    // Rebuild Selector for instantiating new 'selected' ItemKey properly
    this.rebuildSelector({
      background: config.background,
      sideEffects: config.sideEffects,
      force: config.force,
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
  public rebuildSelector(config: SetConfigInterface = {}) {
    config = defineConfig(config, {
      sideEffects: true,
      background: false,
      force: false,
      storage: true,
    });

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
 */
export interface SelectorConfigInterface {
  key?: SelectorKey;
}

/**
 * @param background - If selecting a new Item happens in the background (-> not causing any rerender)
 * @param sideEffects - If Side Effects of Selector get executed
 * @param force - Force to select ItemKey
 * @param overwrite - If the Selector gets overwritten with the new selected Item (initialStateValue, ..)
 */
export interface SelectConfigInterface {
  background?: boolean;
  sideEffects?: boolean;
  force?: boolean;
  overwrite?: boolean;
}
