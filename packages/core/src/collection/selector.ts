import {
  Collection,
  DefaultItem,
  defineConfig,
  Item,
  ItemKey,
  State,
  StateRuntimeJobConfigInterface,
} from '../internal';

export class Selector<
  DataType extends Object = DefaultItem
> extends State<DataType | null> {
  // Collection the Selector belongs to
  public collection: () => Collection<DataType>;

  static rebuildSelectorSideEffectKey = 'rebuildSelector';
  static rebuildItemSideEffectKey = 'rebuildItem';

  // Item the Selector represents
  public _item: Item<DataType> | null;
  // Key/Name identifier of the Item the Selector represents
  public _itemKey: ItemKey | null;

  /**
   * A Selector represents an Item from a Collection in the long term.
   * It can be mutated dynamically and remains in sync with the Collection.
   *
   * Components that need one piece of data from a Collection such as the "current user"
   * would benefit from using Selectors.
   *
   * [Learn more..](https://agile-ts.org/docs/core/collection/selector)
   *
   * @public
   * @param collection - Collection to which the Selector belongs.
   * @param itemKey - Key/Name identifier of the Item to be represented by the Selector.
   * @param config - Configuration object
   */
  constructor(
    collection: Collection<DataType>,
    itemKey: ItemKey | null,
    config: SelectorConfigInterface = {}
  ) {
    config = defineConfig(config, {
      isPlaceholder: false,
    });
    super(collection.agileInstance(), null, config);
    this.collection = () => collection;
    this._item = null;
    this._itemKey = !config.isPlaceholder && itemKey != null ? itemKey : null;
    this._key = config?.key;
    this.isPlaceholder = true; // Because hasn't selected any Item yet

    // Initial select of the Item
    if (this._itemKey != null) this.select(itemKey, { overwrite: true });
  }

  /**
   * Returns the `itemKey` currently selected by the Selector.
   *
   * [Learn more..](https://agile-ts.org/docs/core/collection/selector/properties#itemkey)
   *
   * @public
   */
  public get itemKey(): ItemKey | null {
    return this._itemKey;
  }

  /**
   * Updates the currently selected Item of the Selector
   * based on the specified `itemKey`.
   *
   * [Learn more..](https://agile-ts.org/docs/core/collection/selector/properties#itemkey)
   *
   * @public
   * @param value - New key/name identifier of the Item to be represented by the Selector.
   */
  public set itemKey(value: ItemKey | null) {
    this.select(value);
  }

  /**
   * Retrieves the Item currently selected by the Selector.
   *
   * [Learn more..](https://agile-ts.org/docs/core/collection/selector/properties#item)
   *
   * @public
   */
  public get item(): Item<DataType> | null {
    return this._item;
  }

  /**
   * Updates the currently selected Item of the Selector
   * based on the specified Item.
   *
   * [Learn more..](https://agile-ts.org/docs/core/collection/selector/properties#item)
   *
   * @public
   * @param value - New Item to be represented by the Selector.
   */
  public set item(value: Item<DataType> | null) {
    if (value?._key) this.select(value._key);
  }

  /**
   * Updates the currently selected Item of the Selector.
   *
   * [Learn more..](https://agile-ts.org/docs/core/collection/selector/methods#select)
   *
   * @public
   * @param itemKey - New key/name identifier of the Item to be represented by the Selector.
   * @param config - Configuration object
   */
  public select(
    itemKey: ItemKey | null,
    config: StateRuntimeJobConfigInterface = {}
  ): this {
    config = defineConfig(config, {
      background: false,
      sideEffects: {
        enabled: true,
        exclude: [],
      },
      force: false,
      overwrite: this._item?.isPlaceholder ?? false,
      storage: true,
    });

    // Don't select Item if Collection is not correctly instantiated yet
    // (because only after a successful instantiation the Collection
    // contains the Items which are essential for a proper selection)
    if (
      (!this.collection().isInstantiated || this.hasSelected(itemKey)) &&
      !config.force
    )
      return this;

    // Unselect old Item
    this.unselect({ background: itemKey != null });

    if (itemKey == null) return this;

    // Retrieve new Item from Collection
    const newItem = this.collection().getItemWithReference(itemKey);

    // Select new Item
    this._itemKey = itemKey;
    this._item = newItem;
    newItem.selectedBy.add(this._key as any);

    // Add side effect to the newly selected Item
    // that rebuilds the Selector value depending on the current Item value
    newItem.addSideEffect(
      Selector.rebuildSelectorSideEffectKey,
      (instance, config) => this.rebuildSelector(config),
      { weight: 100 }
    );

    // Add side effect to Selector
    // that updates the Item value depending on the current Selector value
    this.addSideEffect<Selector<DataType>>(
      Selector.rebuildItemSideEffectKey,
      (instance, config) => {
        if (!instance._item?.isPlaceholder)
          instance._item?.set(instance._value as any, {
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

    // Rebuild the Selector to properly 'instantiate' the newly selected Item
    this.rebuildSelector(config);

    return this;
  }

  /**
   * Reselects the currently selected Item.
   *
   * This might be helpful if the Selector failed to select the Item correctly before
   * and therefore should try to select it again.
   *
   * You can use the 'hasSelected()' method to check
   * whether the 'selected' Item is selected correctly.
   *
   * [Learn more..](https://agile-ts.org/docs/core/collection/selector/methods#reselect)
   *
   * @public
   * @param config - Configuration object
   */
  public reselect(config: StateRuntimeJobConfigInterface = {}): this {
    if (
      (this._itemKey != null && !this.hasSelected(this._itemKey)) ||
      config.force
    )
      this.select(this._itemKey, config);
    return this;
  }

  /**
   * Unselects the currently selected Item.
   *
   * Therefore, it sets the `itemKey` and `item` property to `undefined`,
   * since the Selector no longer represents any Item.
   *
   * [Learn more..](https://agile-ts.org/docs/core/collection/selector/methods#unselect)
   *
   * @public
   * @param config - Configuration object
   */
  public unselect(config: StateRuntimeJobConfigInterface = {}): this {
    // Retrieve Item from the Collection because 'this._item' might be outdated
    const item = this.collection().getItem(this._itemKey, {
      notExisting: true,
    });

    // Unselect Item
    if (item != null) {
      item.selectedBy.delete(this._key as any);
      item.removeSideEffect(Selector.rebuildSelectorSideEffectKey);
      item.removeSideEffect(Selector.rebuildItemSideEffectKey);
      if (item.isPlaceholder && this._itemKey != null)
        delete this.collection().data[this._itemKey];
    }

    // Reset Selector
    this._item = null;
    this._itemKey = null;
    this.rebuildSelector(config);
    this.isPlaceholder = true;

    return this;
  }

  /**
   * Returns a boolean indicating whether an Item with the specified `itemKey`
   * is selected by the Selector or not.
   *
   * [Learn more..](https://agile-ts.org/docs/core/collection/selector/methods#hasselected)
   *
   * @public
   * @param itemKey - Key/Name identifier of the Item.
   * @param correctlySelected - Whether the Item has to be selected correctly.
   */
  public hasSelected(
    itemKey: ItemKey | null,
    correctlySelected = true
  ): boolean {
    if (correctlySelected) {
      return (
        this._itemKey === itemKey &&
        this._item != null &&
        this._item.selectedBy.has(this._key as any)
      );
    }
    return this._itemKey === itemKey;
  }

  /**
   * Rebuilds the Selector.
   * During this process, it updates the Selector `value` based on the Item `value`.
   *
   * [Learn more..](https://agile-ts.org/docs/core/collection/selector/methods#rebuild)
   *
   * @public
   * @param config - Configuration object
   */
  public rebuildSelector(config: StateRuntimeJobConfigInterface = {}): this {
    // Assign 'undefined' to the Selector value if no Item is set
    if (this._item == null || this._item.isPlaceholder) {
      this.set(null, config);
      return this;
    }

    // Assign the current Item value to the Selector value
    this.set(this._item._value, config);

    return this;
  }
}

export type SelectorKey = string | number;

export interface SelectorConfigInterface {
  /**
   * Key/Name identifier of the Selector.
   * @default undefined
   */
  key?: SelectorKey;
  /**
   * Whether the Selector should be a placeholder
   * and therefore should only exist in the background.
   * @default false
   */
  isPlaceholder?: boolean;
}
