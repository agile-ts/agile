import {Collection, DefaultDataItem, ItemKey} from "./index";
import {Computed} from "../computed";
import Item from "./item";

export class Selector<DataType = DefaultDataItem> extends Computed<DataType> {

    public collection: () => Collection<DataType>;
    public _id: ItemKey;

    constructor(collection: Collection<DataType>, key: ItemKey) {
        // If no key provided set it to dummy (dummyKey)
        if (!key)
            key = 'dummy';

        // Instantiate Computed with 'computed' function
        super(collection.agileInstance(), () => findData<DataType>(collection, key));

        this.collection = () => collection;
        this._id = key;

        // Set type of State to object because a collection item is always an object
        this.type(Object);
    }

    public set id(val: ItemKey) {
        this._id = val;

        // Update Computed Function with new key(id)
        this.computeFunction = () => findData<DataType>(this.collection(), val);

        // Recompute to apply changes properly
        this.recompute();
    }

    public get id() {
        return this._id;
    }


    //=========================================================================================================
    // Select
    //=========================================================================================================
    /**
     * Changes the selector key
     */
    public select(key: ItemKey) {
        this.id = key;
    }
}


//=========================================================================================================
// Find Data
//=========================================================================================================
/**
 * Computed function for the Selector
 */
function findData<DataType>(collection: Collection<DataType>, key: ItemKey) {
    // Find data by id in collection
    let data = collection.findById(key).value;

    // If data is not found, create placeholder data, so that when real data is collected it maintains connection
    if (!data) {
        collection.data[key] = new Item<DataType>(collection, {id: key} as any);
        data = collection.findById(key).value as DataType;
    }

    return data;
}
