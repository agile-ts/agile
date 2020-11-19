import {
  Agile,
  Collection,
  copy,
  DefaultItem,
  defineConfig,
  Item,
  ItemKey,
  State,
} from "../internal";

export class Selector<DataType = DefaultItem> extends State<
  DataType | undefined
> {
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
    super(collection.agileInstance(), collection.getItemValue(itemKey));
    this.collection = () => collection;
    this.item = undefined;
    this._itemKey = itemKey;
    this.key = config?.key;

    // Initial Select
    this.select(itemKey);
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
   * Select new ItemKey that the Selector will represents
   * @param itemKey - New ItemKey
   * @param config - Config
   */
  public select(itemKey: ItemKey, config: SelectConfigInterface = {}): this {
    const oldItem = this.item;
    let newItem = this.collection().getItemWithReference(itemKey);
    const rebuildSelectorSideEffectKey = "rebuildSelector";
    config = defineConfig(config, {
      background: false,
      sideEffects: true,
      force: false,
    });

    if (oldItem?.key === itemKey && !config.force) {
      Agile.logger.warn(
        `Agile: Selector has already a selected key '${itemKey}'!`
      );
      return this;
    }

    // Remove old Item from Collection if it is an Placeholder
    if (oldItem?.isPlaceholder) delete this.collection().data[this.itemKey];

    // Remove Selector sideEffect from old Item
    oldItem?.removeSideEffect(rebuildSelectorSideEffectKey);

    this._itemKey = itemKey;
    this.item = newItem;

    // Add Selector sideEffect to Item
    newItem.addSideEffect(rebuildSelectorSideEffectKey, () =>
      this.rebuildSelector(config)
    );

    // Rebuild Selector for instantiating new 'selected' ItemKey properly
    this.rebuildSelector(config);

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
  public rebuildSelector(config: SelectConfigInterface = {}) {
    config = defineConfig(config, {
      background: false,
      sideEffects: true,
    });

    // Set Selector Value to undefined if Item doesn't exist
    if (!this.item || this.item.isPlaceholder) {
      this._value = undefined;
      return;
    }

    // Assign ItemValue to Selector
    this.nextStateValue = copy(this.item?.value);

    // Ingest nextStateValue into Runtime
    this.ingest(config);
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
 */
export interface SelectConfigInterface {
  background?: boolean;
  sideEffects?: boolean;
  force?: boolean;
}
