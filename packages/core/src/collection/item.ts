import { State, Collection, DefaultItem } from "../internal";

export class Item<DataType = DefaultItem> extends State<DataType> {
  private collection: () => Collection;

  /**
   * @public
   * Item of Collection
   * @param collection - Collection to which the Item belongs
   * @param data - Data that the Item holds
   */
  constructor(collection: Collection, data: DataType) {
    super(collection.agileInstance(), data);
    this.collection = () => collection;

    // Setting primaryKey of Data to Key/Name of Item
    this.key = data[collection.config?.primaryKey || "id"];

    // Add RebuildGroupThatIncludePrimaryKey to sideEffects, so that it rebuilds the Group if it changes
    this.addSideEffect("rebuildGroup", (properties: any) =>
      collection.rebuildGroupsThatIncludePrimaryKey(this.key || "", properties)
    );
  }
}
