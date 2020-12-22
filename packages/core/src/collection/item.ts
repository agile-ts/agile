import { State, Collection, DefaultItem, StateKey } from "../internal";

export class Item<DataType = DefaultItem> extends State<DataType> {
  static updateGroupSideEffectKey = "rebuildGroup";
  public collection: () => Collection<DataType>;

  /**
   * @public
   * Item of Collection
   * @param collection - Collection to which the Item belongs
   * @param data - Data that the Item holds
   */
  constructor(collection: Collection<DataType>, data: DataType) {
    super(collection.agileInstance(), data);
    this.collection = () => collection;

    // Set Key/Name of Item to primaryKey of Data
    this.setKey(data[collection.config.primaryKey]);
  }

  //=========================================================================================================
  // Set Key
  //=========================================================================================================
  /**
   * @internal
   * Updates Key/Name of State
   * @param value - New Key/Name of State
   */
  public setKey(value: StateKey | undefined): this {
    super.setKey(value);
    if (!value) return this;

    // Remove old rebuildGroupsThatIncludeItemKey sideEffect
    this.removeSideEffect(Item.updateGroupSideEffectKey);

    // Add rebuildGroupsThatIncludeItemKey to sideEffects to rebuild Groups that include this Item if it changes
    this.addSideEffect(Item.updateGroupSideEffectKey, (config) =>
      this.collection().rebuildGroupsThatIncludeItemKey(value, config)
    );

    // Initial Rebuild
    this.collection().rebuildGroupsThatIncludeItemKey(value);

    return this;
  }
}
