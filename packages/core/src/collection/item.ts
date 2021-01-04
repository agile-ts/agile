import {
  State,
  Collection,
  DefaultItem,
  StateKey,
  StateRuntimeJobConfigInterface,
  defineConfig,
} from "../internal";

export class Item<DataType = DefaultItem> extends State<DataType> {
  static updateGroupSideEffectKey = "rebuildGroup";
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

    // Reassign Key to assign sideEffects
    this.setKey(data[collection.config.primaryKey]);
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

    // Update ItemKey in ItemValue
    this.set(
      {
        ...{ [this.collection().config.primaryKey]: value },
        ...this.nextStateValue,
      },
      config
    );

    // Remove old rebuildGroupsThatIncludeItemKey sideEffect
    this.removeSideEffect(Item.updateGroupSideEffectKey);

    // Add rebuildGroupsThatIncludeItemKey to sideEffects to rebuild Groups that include this Item if it changes
    this.addSideEffect(Item.updateGroupSideEffectKey, (config) =>
      this.collection().rebuildGroupsThatIncludeItemKey(value, config)
    );

    // Initial Rebuild
    this.collection().rebuildGroupsThatIncludeItemKey(value, {
      background: config.background,
      force: config.force,
      sideEffects: config.sideEffects,
    });

    return this;
  }
}

/**
 * @param isPlaceholder - If Item is initially a Placeholder
 */
export interface ItemConfigInterface {
  isPlaceholder?: boolean;
}
