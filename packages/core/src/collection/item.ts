import {
  State,
  Collection,
  DefaultItem,
  StateKey,
  StateRuntimeJobConfigInterface,
  defineConfig,
} from '../internal';

export class Item<DataType = DefaultItem> extends State<DataType> {
  static updateGroupSideEffectKey = 'rebuildGroup';
  public isSelected = false; // If Item is selected by a Selector
  public collection: () => Collection<DataType>;

  /**
   * @public
   * Item of Collection
   * @param collection - Collection to which the Item belongs
   * @param data - Data that the Item holds
   * @param config - Config
   */
  constructor(
    collection: Collection<DataType>,
    data: DataType,
    config: ItemConfigInterface = {}
  ) {
    super(collection.agileInstance(), data, {
      isPlaceholder: config.isPlaceholder,
      key: data[collection.config.primaryKey], // Set Key/Name of Item to primaryKey of Data
    });
    this.collection = () => collection;

    // Add rebuildGroupsThatIncludeItemKey to sideEffects to rebuild Groups that include this Item if it mutates
    this.addSideEffect(Item.updateGroupSideEffectKey, (config) =>
      this.collection().rebuildGroupsThatIncludeItemKey(
        this._key || 'unknown',
        config
      )
    );
  }

  //=========================================================================================================
  // Set Key
  //=========================================================================================================
  /**
   * @internal
   * Updates Key/Name of State
   * @param value - New Key/Name of State
   * @param config - Config
   */
  public setKey(
    value: StateKey | undefined,
    config: StateRuntimeJobConfigInterface = {}
  ): this {
    super.setKey(value);
    config = defineConfig(config, {
      sideEffects: true,
      background: false,
      force: false,
      storage: true,
      overwrite: false,
    });
    if (!value) return this;

    // Remove old rebuildGroupsThatIncludeItemKey sideEffect
    this.removeSideEffect(Item.updateGroupSideEffectKey);

    // Add rebuildGroupsThatIncludeItemKey to sideEffects to rebuild Groups that include this Item if it mutates
    this.addSideEffect(Item.updateGroupSideEffectKey, (config) =>
      this.collection().rebuildGroupsThatIncludeItemKey(value, config)
    );

    // Update ItemKey in ItemValue (After updating the sideEffect because otherwise it calls the old sideEffect)
    this.patch(
      { [this.collection().config.primaryKey]: value },
      {
        sideEffects: config.sideEffects,
        background: config.background,
        force: config.force,
        storage: config.storage,
        overwrite: config.overwrite,
      }
    );
    return this;
  }
}

/**
 * @param isPlaceholder - If Item is initially a Placeholder
 */
export interface ItemConfigInterface {
  isPlaceholder?: boolean;
}
