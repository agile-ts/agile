import {Collection, DefaultDataItem} from "./index";
import {State} from "../state";
import Agile from "../agile";
import {defineConfig} from "../utils";

export type PrimaryKey = string | number;
export type GroupKey = string | number;

export interface GroupAddOptionsInterface {
    method?: 'unshift' | 'push'; // method to add to group
    overwrite?: boolean; // set to false to leave primary key in place if it already exists
}

export interface GroupConfigInterface {
    key?: GroupKey // should be a unique key/name which identifies the group
}

export class Group<DataType = DefaultDataItem> extends State<Array<PrimaryKey>> {
    collection: () => Collection<DataType>;

    _output: Array<DataType> = []; // Output of the collection (Note: _value are only the keys of the collection items)
    notFoundPrimaryKeys: Array<PrimaryKey> = []; // Contains all key which can't be found in the collection

    constructor(agileInstance: Agile, collection: Collection<DataType>, initialItems?: Array<PrimaryKey>, config?: GroupConfigInterface) {
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
        // Add state to foundState (for auto tracking used states in computed functions)
        if (this.agileInstance().runtime.trackState)
            this.agileInstance().runtime.foundStates.add(this);

        return this._output;
    }


    //=========================================================================================================
    // Has
    //=========================================================================================================
    /**
     * Checks if the group contains the primaryKey
     */
    public has(primaryKey: PrimaryKey) {
        return this.value.includes(primaryKey) || false;
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
    public remove(primaryKey: PrimaryKey): this {
        // remove primaryKey from nextState
        this.nextState = this.nextState.filter((i) => i !== primaryKey);

        // Set State to nextState
        this.set();

        return this;
    }


    //=========================================================================================================
    // Add
    //=========================================================================================================
    /**
     * Adds a key to a group
     */
    public add(primaryKey: PrimaryKey, options: GroupAddOptionsInterface = {}): this {
        const exists = this.nextState.includes(primaryKey);

        // Merge default values into options
        options = defineConfig(options, {method: 'push', overwrite: true});

        // Removes temporary key from group to overwrite it properly
        if (options.overwrite)
            this.nextState = this.nextState.filter((i) => i !== primaryKey);
        // If we do not want to overwrite and key already exists in group, exit
        else if (exists)
            return this;

        // Push or unshift into state
        this.nextState[options.method || 'push'](primaryKey);

        // Set State to nextState
        this.set();

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

        // Map trough group key and returns their value
        const finalOutput = this._value
            .map((primaryKey) => {
                // Get collection data at the primaryKey position
                let data = this.collection().data[primaryKey];

                // if no data found add this key to missing PrimaryKeys
                if (!data) {
                    this.notFoundPrimaryKeys.push(primaryKey);
                    return;
                }

                // Return state value of data
                return data.value;
            }).filter(item => item !== undefined);

        // Log not found primaryKeys
        if(this.notFoundPrimaryKeys.length > 0 && this.agileInstance().config.logJobs)
            console.warn(`Agile: Couldn't find states with the primary keys in group ${this.key}`, this.notFoundPrimaryKeys)

        // @ts-ignore
        this._output = finalOutput;
    }
}
