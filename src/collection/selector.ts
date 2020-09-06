import {Collection, DefaultDataItem, ItemKey} from "./index";
import {Computed} from "../computed";
import Item from "./item";
import {persistValue} from "../state/persist";
import {StorageKey} from "../storage";
import {copy, defineConfig} from "../utils";

export type SelectorKey = string | number;

export interface SelectorConfigInterface {
    key?: SelectorKey // should be a unique key/name which identifies the selector
}

export class Selector<DataType = DefaultDataItem> extends Computed<DataType | undefined> {

    public collection: () => Collection<DataType>;
    public _id: ItemKey;

    constructor(collection: Collection<DataType>, id: ItemKey, config?: SelectorConfigInterface) {
        // If no key provided set it to dummy (dummyKey)
        if (!id) id = 'dummy';

        // Instantiate Computed with 'computed' function
        super(collection.agileInstance(), () => findData<DataType>(collection, id));

        if (config?.key)
            this._key = config?.key;

        this.collection = () => collection;
        this._id = id;

        // Set type of State to object because a collection item is always an object
        this.type(Object);
    }

    public set id(val: ItemKey) {
        this.select(val);
    }

    public get id() {
        return this._id;
    }


    //=========================================================================================================
    // Select
    //=========================================================================================================
    /**
     * Changes the id on which the selector is watching
     */
    public select(id: ItemKey, options?: { background?: boolean, sideEffects?: boolean }) {
        // Assign defaults to config
        options = defineConfig(options, {
            background: false,
            sideEffects: true
        });

        // Remove item if its a placeholder because if so it won't be needed without being selected by this selector
        if (this.collection().data[this.id]?.isPlaceholder)
            delete this.collection().data[this.id];

        // Set _id to new id
        this._id = id;

        // Update Computed Function with new key(id)
        this.updateComputeFunction(() => findData<DataType>(this.collection(), id), [], options);
    }


    //=========================================================================================================
    // Overwrite Persist
    //=========================================================================================================
    /**
     * Saves the state in the local storage or in a own configured storage
     * @param key - the storage key (if no key passed it will take the state key)
     */
    public persist(key?: StorageKey): this {
        persistValue(this, key);
        return this;
    }


    //=========================================================================================================
    // Overwrite getPerstiableValue
    //=========================================================================================================
    /**
     * @internal
     *  Will return the perstiable Value of this state..
     */
    public getPersistableValue() {
        return this.id;
    }
}


//=========================================================================================================
// Find Data
//=========================================================================================================
/**
 * Computed function for the Selector
 */
function findData<DataType>(collection: Collection<DataType>, id: ItemKey) {
    // Find data by id in collection
    let item = collection.findById(id);

    // If data is not found, create placeholder item, so that when real data is collected it maintains connection and causes a rerender
    if (!item) {
        const newItem = new Item<DataType>(collection, {id: id} as any);
        newItem.isPlaceholder = true;
        collection.data[id] = newItem;
        item = newItem;
    }

    // If initial State is still {id: id}.. because of placeholder item and the value isn't {id: id} -> had got real value.. set the initial State to this first real value
    if (JSON.stringify(item.initialState) === JSON.stringify({id: id}) && JSON.stringify(item.nextState) !== JSON.stringify({id: id})) {
        item.initialState = copy(item.nextState);
        item.previousState = copy(item.nextState);
    }

    // Have to create the final Value here, to get added to the track states also if the item doesn't exist yet.. (otherwise auto tracking state wouldn't work -> this won't get called if the item changes )
    const finalValue = item.value;

    // If item doesn't exist return undefined.. otherwise it would return {id: id}
    if (!item.exists)
        return undefined;

    return finalValue;
}
