import { State, Collection, DefaultItem, StateKey } from "../internal";

export class Item<DataType = DefaultItem> extends State<DataType> {
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

    // Setting primaryKey of Data to Key/Name of Item
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

    // Update rebuildGroupThatIncludePrimaryKey SideEffect
    this.removeSideEffect("rebuildGroup");
    this.addSideEffect("rebuildGroup", (properties: any) =>
      this.collection().rebuildGroupsThatIncludeItemKey(value, properties)
    );
    return this;
  }
}
