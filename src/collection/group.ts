import {Collection, DefaultDataItem, ItemKey} from "./index";
import {State} from "../state";
import Agile from "../agile";
import {defineConfig} from "../utils";
import {updateGroup} from "./perstist";

export type GroupKey = string | number;

export interface GroupAddOptionsInterface {
    method?: 'unshift' | 'push' // method to add to group
    overwrite?: boolean // set to false to leave primary key in place if it already exists
    background?: boolean
}

export interface GroupConfigInterface {
    key?: GroupKey // should be a unique key/name which identifies the group
}

export class Group<DataType = DefaultDataItem> extends State<Array<ItemKey>> {
    collection: () => Collection<DataType>;

    _output: Array<DataType> = []; // Output of the group (Note: _value are only the keys of the collection items)
    _states: Array<State<DataType>> = []; // States of the Group
    notFoundPrimaryKeys: Array<ItemKey> = []; // Contains all key which can't be found in the collection

    constructor(agileInstance: Agile, collection: Collection<DataType>, initialItems?: Array<ItemKey>, config?: GroupConfigInterface) {
        super(agileInstance, initialItems || [], config?.key);
        this.collection = () => collection;

        // Set build() to state sideEffect
        this.sideEffects = () => this.build();

        // Set type of State to array because a group is an array of collection item keys
        this.type(Array);

        // Initial Build
        this.build();
    }

    public get output(): Array<DataType> {
        // Add state(group) to foundState (for auto tracking used states in computed functions)
        if (this.agileInstance().runtime.trackState)
            this.agileInstance().runtime.foundStates.add(this);

        return this._output;
    }

    public get states(): Array<State<DataType>> {
        // Add state(group) to foundState (for auto tracking used states in computed functions)
        if (this.agileInstance().runtime.trackState)
            this.agileInstance().runtime.foundStates.add(this);

        return this._states;
    }

    //=========================================================================================================
    // Has
    //=========================================================================================================
    /**
     * Checks if the group contains the primaryKey
     */
    public has(primaryKey: ItemKey) {
        return this.value.findIndex(key => key === primaryKey) !== -1;
    }


    //=========================================================================================================
    // Size
    //=========================================================================================================
    /**
     * Returns the size of the group
     */
    public get size(): number {
        return this.value.length;
    }


    //=========================================================================================================
    // Remove
    //=========================================================================================================
    /**
     * Removes a item at primaryKey from the group
     */
    public remove(itemKey: ItemKey): this {
        // Check if primaryKey exists in group if not, return
        if (this.value.findIndex(key => key === itemKey) === -1) {
            console.error(`Agile: Couldn't find primaryKey '${itemKey} in group`, this);
            return this;
        }

        // Remove primaryKey from nextState
        this.nextState = this.nextState.filter((i) => i !== itemKey);

        // Set State to nextState
        this.ingest();

        // Storage
        if (this.key)
            updateGroup(this.key, this.collection());

        return this;
    }


    //=========================================================================================================
    // Add
    //=========================================================================================================
    /**
     * Adds a key to a group
     */
    public add(itemKey: ItemKey, options: GroupAddOptionsInterface = {}): this {
        const exists = this.nextState.findIndex(key => key === itemKey) !== -1;

        // Merge default values into options
        options = defineConfig(options, {method: 'push', overwrite: true});

        // Removes temporary key from group to overwrite it properly
        if (options.overwrite)
            this.nextState = this.nextState.filter((i) => i !== itemKey);
        // If we do not want to overwrite and key already exists in group, exit
        else if (exists)
            return this;

        // Push or unshift into state
        this.nextState[options.method || 'push'](itemKey);

        // Set State to nextState
        this.ingest({background: options.background});

        // Storage
        if (this.key)
            updateGroup(this.key, this.collection());

        return this;
    }


    //=========================================================================================================
    // Build
    //=========================================================================================================
    /**
     * @internal
     * Will build the group -> it will set the output to the collection values
     */
    public build() {
        this.notFoundPrimaryKeys = [];

        // Check if _value is an array if not something went wrong because a group is always an array
        if (!Array.isArray(this._value)) {
            console.error("Agile: A group state has to be an array!");
            return;
        }

        // Map though group _value (collectionKey array) and get their state from collection
        const finalStates = this._value
            .map((primaryKey) => {
                // Get collection data at the primaryKey position
                let data = this.collection().data[primaryKey];

                // If no data found add this key to missing PrimaryKeys
                if (!data) {
                    this.notFoundPrimaryKeys.push(primaryKey);
                    return;
                }

                return data as State<DataType>;
            }).filter(item => item !== undefined);

        // Map though found States and return their publicValue
        const finalOutput = finalStates
            .map((state) => {
                // @ts-ignore
                return state.getPublicValue();
            });

        // Log not found primaryKeys
        if (this.notFoundPrimaryKeys.length > 0 && this.agileInstance().config.logJobs)
            console.warn(`Agile: Couldn't find states with the primary keys in group '${this.key}'`, this.notFoundPrimaryKeys);

        // @ts-ignore
        this._states = finalStates;
        this._output = finalOutput;
    }
}
