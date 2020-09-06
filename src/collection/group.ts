import {Collection, DefaultDataItem, ItemKey} from "./index";
import {State} from "../state";
import Agile from "../agile";
import {defineConfig, normalizeArray} from "../utils";
import {updateGroup} from "./perstist";

export type GroupKey = string | number;

export interface GroupAddOptionsInterface {
    method?: 'unshift' | 'push' // Method for adding item to group
    overwrite?: boolean // Set to false to leave primary key in place if it already exists
    background?: boolean // If the action should happen in the background -> no rerender
}

export interface GroupConfigInterface {
    key?: GroupKey // should be a unique key/name which identifies the group
}

export class Group<DataType = DefaultDataItem> extends State<Array<ItemKey>> {
    collection: () => Collection<DataType>;

    _output: Array<DataType> = []; // Output of the group (Note: _value are only the keys of the collection items)
    _states: Array<() => State<DataType>> = []; // States of the Group
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

        return this._states.map(state => state());
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
    public remove(itemKeys: ItemKey | ItemKey[], options: { background?: boolean } = {}): this {
        const _itemKeys = normalizeArray<ItemKey>(itemKeys);
        const notExistingCollectionItems: Array<ItemKey> = [];

        // Merge default values into options
        options = defineConfig(options, {
            background: false
        });

        _itemKeys.forEach(itemKey => {
            // If item doesn't exist in collection add it to notExistingItems
            if (!this.collection().findById(itemKey))
                notExistingCollectionItems.push(itemKey);

            // Check if primaryKey exists in group if not, return
            if (this.value.findIndex(key => key === itemKey) === -1) {
                console.error(`Agile: Couldn't find primaryKey '${itemKey}' in group`, this);
                return;
            }

            // Remove primaryKey from nextState
            this.nextState = this.nextState.filter((i) => i !== itemKey);

            // Storage
            if (this.key)
                updateGroup(this.key, this.collection());
        });

        // If all items don't exist in collection.. set background to true because the output won't change -> no rerender necessary
        if (notExistingCollectionItems.length >= _itemKeys.length)
            options.background = true;

        // Set State to nextState
        this.ingest(options);

        return this;
    }


    //=========================================================================================================
    // Add
    //=========================================================================================================
    /**
     * Adds a key to a group
     */
    public add(itemKeys: ItemKey | ItemKey[], options: GroupAddOptionsInterface = {}): this {
        const _itemKeys = normalizeArray<ItemKey>(itemKeys);
        const notExistingCollectionItems: Array<ItemKey> = [];
        let newNextState = [...this.nextState]; // Had to create copy array otherwise also 'this.value' would change.. by changing 'this.nextState' directly.

        // Merge default values into options
        options = defineConfig<GroupAddOptionsInterface>(options, {
            method: 'push',
            overwrite: false,
            background: false
        });

        _itemKeys.forEach(itemKey => {
            // Check if item already exists in group
            const existsInGroup = newNextState.findIndex(key => key === itemKey) !== -1;

            // If item doesn't exist in collection add it to notExistingItems
            if (!this.collection().findById(itemKey))
                notExistingCollectionItems.push(itemKey);

            // Removes temporary key from group to overwrite it properly
            if (options.overwrite)
                newNextState = newNextState.filter((i) => i !== itemKey);
            // If we do not want to overwrite and key already exists in group, exit
            else if (existsInGroup)
                return;

            // Push or unshift into state
            newNextState[options.method || 'push'](itemKey);

            // Storage
            if (this.key) updateGroup(this.key, this.collection());
        });

        // If all items don't exist in collection.. set background to true because the output won't change -> no rerender necessary
        if (notExistingCollectionItems.length >= _itemKeys.length)
            options.background = true;

        // Set nextState to newNextState
        this.nextState = newNextState;

        // Set State to nextState
        this.ingest({background: options.background});

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
        this._states = finalStates.map(state => (() => state));
        this._output = finalOutput;
    }
}
