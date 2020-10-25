import {
  Collection,
  copy,
  DefaultItem,
  defineConfig,
  equal,
  Item,
  ItemKey,
  State,
} from "../internal";

export class Selector<DataType = DefaultItem> extends State<
  DataType | undefined
> {
  public collection: () => Collection<DataType>;
  public item: Item<DataType> | undefined;
  public _id: ItemKey;

  /**
   * @public
   * Selects and Watches Item of Collection
   * @param collection - Collection the Item is in
   * @param id - Id/ItemKey of the Item which the Selector represents
   * @param config - Config
   */
  constructor(
    collection: Collection<DataType>,
    id: ItemKey,
    config?: SelectorConfigInterface
  ) {
    super(collection.agileInstance(), collection.getValueById(id));
    this.collection = () => collection;
    this.item = undefined;
    this._id = id;
    this.key = config?.key;

    // Initial Select
    this.select(id);
  }

  /**
   * @public
   * Update Id/ItemKey that the Selector is representing
   */
  public set id(value: ItemKey) {
    this.select(value);
  }

  /**
   * @public
   * Get Id/ItemKey that the Selector is representing
   */
  public get id() {
    return this._id;
  }

  /**
   * @public
   * Select new Id/ItemKey which the Selector represents
   * @param id - New Id/ItemKey the Selector will represent
   * @param config - Config
   */
  public select(id: ItemKey, config: SelectConfigInterface = {}): this {
    const oldItem = this.item;
    let newItem = this.collection().getItemById(id);
    config = defineConfig(config, {
      background: false,
      sideEffects: true,
    });

    // Remove old Item from Collection if it is an Placeholder
    if (oldItem?.isPlaceholder) delete this.collection().data[this.id];

    // Create dummy Item to hold reference
    if (!newItem) {
      newItem = new Item<DataType>(this.collection(), { id: id } as any);
      newItem.isPlaceholder = true;
      this.collection().data[id] = newItem;
    }

    // Remove Selector sideEffect from old Item
    oldItem?.removeSideEffect("rebuildSelector");

    this._id = id;
    this.item = newItem;

    // Add rebuildSelector to sideEffects of the Item
    newItem.addSideEffect("rebuildSelector", this.rebuildSelector);

    // Rebuild Selector for instantiating new 'selected' ItemKey properly
    this.rebuildSelector(config);

    return this;
  }

  /**
   * Rebuilds Selector
   * @param config - Config
   */
  public rebuildSelector(config: SelectConfigInterface = {}) {
    config = defineConfig(config, {
      background: false,
      sideEffects: true,
    });

    console.log(this.item); // TODO REMOVE
    console.log(this); // TODO REMOVE

    if (!this.item || this.item.isPlaceholder) {
      this._value = undefined;
      return;
    }

    // Assign ItemValue to Selector
    this.nextStateValue = this.item?.value;

    // Fix initialStateValue and previousStateValue if they are still set from placeholder
    if (equal(this.item.initialStateValue, { id: this.id }))
      this.item.initialStateValue = copy(this.item?.nextStateValue);
    if (equal(this.item.previousStateValue, { id: this.id }))
      this.item.previousStateValue = copy(this.nextStateValue);

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

export interface SelectConfigInterface {
  background?: boolean;
  sideEffects?: boolean;
}
