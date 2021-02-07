import {
  Agile,
  Collection,
  DefaultItem,
  defineConfig,
  Item,
  ItemKey,
  State,
  StateRuntimeJobConfigInterface,
} from '../internal';

export class Selector<DataType = DefaultItem> extends State<
  DataType | undefined
> {
  static dummyItemKey = 'unknown';
  static rebuildSelectorSideEffectKey = 'rebuildSelector';
  static rebuildItemSideEffectKey = 'rebuildItem';
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
    this._itemKey = Selector.dummyItemKey;
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

  //=========================================================================================================
  // Select
  //=========================================================================================================
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
    const oldItem = this.collection().getItem(this._itemKey, {
      notExisting: true,
    }); // Because this.item might be outdated
    const newItem = this.collection().getItemWithReference(itemKey);
    config = defineConfig(config, {
      background: false,
      sideEffects: {
        enabled: true,
        exclude: [],
      },
      force: false,
      overwrite: oldItem?.isPlaceholder || false,
      storage: true,
    });

    if (this.hasSelected(itemKey) && !config.force) {
      Agile.logger.warn(`Selector has already selected '${itemKey}'!`);
      return this;
    }

    // Unselect old Item
    this.unselect({ background: true });

    this._itemKey = itemKey;
    this.item = newItem;
    newItem.isSelected = true;

    // Add SideEffect to newItem, that rebuild this Selector depending on the current Item Value
    newItem.addSideEffect(
      Selector.rebuildSelectorSideEffectKey,
      (instance, config) => this.rebuildSelector(config),
      { weight: 100 }
    );

    // Add sideEffect to Selector, that updates the Item Value if this Value got updated
    this.addSideEffect<Selector<DataType>>(
      Selector.rebuildItemSideEffectKey,
      (instance, config) => {
        if (!instance.item?.isPlaceholder)
          instance.item?.set(instance._value as any, {
            ...config,
            ...{
              sideEffects: {
                enabled: true,
                exclude: [Selector.rebuildItemSideEffectKey], // Exclude to avoid endless loops
              },
            },
          });
      }
    );

    // Rebuild Selector for instantiating new 'selected' ItemKey properly
    this.rebuildSelector(config);

    return this;
  }

  //=========================================================================================================
  // Unselect
  //=========================================================================================================
  /**
   * @public
   * Unselects current selected Item
   * @param config - Config
   */
  public unselect(config: StateRuntimeJobConfigInterface = {}): this {
    // Because this.item might be outdated
    const item = this.collection().getItem(this._itemKey, {
      notExisting: true,
    });

    // Unselect Item
    if (item) {
      item.isSelected = false;
      item.removeSideEffect(Selector.rebuildSelectorSideEffectKey);
      item.removeSideEffect(Selector.rebuildItemSideEffectKey);
      if (item.isPlaceholder) delete this.collection().data[this._itemKey];
    }

    // Reset and rebuild Selector
    this.item = undefined;
    this._itemKey = Selector.dummyItemKey;
    this.rebuildSelector(config);

    this.isPlaceholder = true;

    return this;
  }

  //=========================================================================================================
  // Has Selected
  //=========================================================================================================
  /**
   * Checks if Selector has selected passed ItemKey
   * @param itemKey
   */
  public hasSelected(itemKey: ItemKey): boolean {
    const isSelected = this._itemKey === itemKey;
    if (!this.item) return isSelected;
    return isSelected && this.item.isSelected;
  }

  //=========================================================================================================
  // Rebuild Selector
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
