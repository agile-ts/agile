import {
  Collection,
  DefaultItem,
  defineConfig,
  Item,
  ItemKey,
  State,
  StateRuntimeJobConfigInterface,
} from '../internal';

export class Selector<DataType extends Object = DefaultItem> extends State<
  DataType | undefined
> {
  static unknownItemPlaceholderKey = '__UNKNOWN__ITEM__KEY__';
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
    config = defineConfig(config, {
      isPlaceholder: false,
    });
    super(collection.agileInstance(), undefined, config);
    this.collection = () => collection;
    this.item = undefined;
    this._itemKey = !config.isPlaceholder
      ? itemKey
      : Selector.unknownItemPlaceholderKey;
    this._key = config?.key;
    this.isPlaceholder = true; // Because hasn't selected any Item yet

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
    config = defineConfig(config, {
      background: false,
      sideEffects: {
        enabled: true,
        exclude: [],
      },
      force: false,
      overwrite: this.item?.isPlaceholder ?? false,
      storage: true,
    });

    // Don't select Item if Collection is not properly instantiated
    // (because only after a successful instantiation the Collection
    // contains the Items which are essential for a proper selection)
    if (
      (!this.collection().isInstantiated || this.hasSelected(itemKey)) &&
      !config.force
    )
      return this;

    // Unselect old Item
    this.unselect({ background: true });

    // Get new Item
    const newItem = this.collection().getItemWithReference(itemKey);

    // Select new Item
    this._itemKey = itemKey;
    this.item = newItem;
    newItem.selectedBy.add(this._key as any);

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
                exclude: [Selector.rebuildSelectorSideEffectKey], // Exclude to avoid endless loops
              },
            },
          });
      },
      { weight: 90 }
    );

    // Rebuild Selector for instantiating new 'selected' ItemKey properly
    this.rebuildSelector(config);

    return this;
  }

  //=========================================================================================================
  // Reselect
  //=========================================================================================================
  /**
   * @public
   * Reselect Item
   * Might help if the Selector failed to properly select an Item.
   * You can check with 'hasSelected()' if an Item got properly selected.
   * @param config - Config
   */
  public reselect(config: StateRuntimeJobConfigInterface = {}): this {
    if (
      (this._itemKey != null && !this.hasSelected(this._itemKey)) ||
      config.force
    )
      this.select(this.itemKey, config);
    return this;
  }

  //=========================================================================================================
  // Unselect
  //=========================================================================================================
  /**
   * @public
   * Unselects current selected Item.
   * Often not necessary because by selecting a new Item,
   * the old Item is automatically unselected.
   * @param config - Config
   */
  public unselect(config: StateRuntimeJobConfigInterface = {}): this {
    // Because this.item might be outdated
    const item = this.collection().getItem(this._itemKey, {
      notExisting: true,
    });

    // Unselect Item
    if (item) {
      item.selectedBy.delete(this._key as any);
      item.removeSideEffect(Selector.rebuildSelectorSideEffectKey);
      item.removeSideEffect(Selector.rebuildItemSideEffectKey);
      if (item.isPlaceholder) delete this.collection().data[this._itemKey];
    }

    // Reset and rebuild Selector
    this.item = undefined;
    this._itemKey = Selector.unknownItemPlaceholderKey;
    this.rebuildSelector(config);

    this.isPlaceholder = true;

    return this;
  }

  //=========================================================================================================
  // Has Selected
  //=========================================================================================================
  /**
   * Checks if Selector has correctly selected the Item at the passed itemKey
   * @param itemKey - ItemKey
   */
  public hasSelected(itemKey: ItemKey): boolean {
    return (
      this._itemKey === itemKey &&
      this.item != null &&
      this.item.selectedBy.has(this._key as any)
    );
  }

  //=========================================================================================================
  // Rebuild Selector
  //=========================================================================================================
  /**
   * @public
   * Rebuilds Selector,
   * which updates the Selector value based on the Item value
   * @param config - Config
   */
  public rebuildSelector(config: StateRuntimeJobConfigInterface = {}): this {
    // Set Selector Value to undefined if Item doesn't exist
    if (this.item == null || this.item.isPlaceholder) {
      this.set(undefined, config);
      return this;
    }

    // Set Selector Value to updated Item Value
    this.set(this.item._value, config);

    return this;
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
