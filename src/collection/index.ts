import Agile from "../agile";
import Item from "./item";
import {Group, GroupConfigInterface, GroupKey} from "./group";
import {Selector, SelectorKey} from "./selector";
import {copy, defineConfig, flatMerge, isValidObject, normalizeArray} from "../utils";
import {State, StateKey} from "../state";

export type DefaultDataItem = { [key: string]: any };
export type CollectionKey = string | number;
export type ItemKey = string | number; // The key of an item in a collection

export interface CollectionConfigInterface {
    groups?: { [key: string]: Group<any> } | string[]
    selectors?: { [key: string]: Selector<any> } | string[]
    key?: CollectionKey // should be a unique key/name which identifies the collection
    primaryKey?: string // the primaryKey of an item (default is id)
    defaultGroupKey?: ItemKey // The defaultGroupKey(Name).. in which all collected items get stored
    // indexAll?: boolean
}

export interface CollectOptionsInterface<DataType = any> {
    patch?: boolean
    method?: 'push' | 'unshift'
    forEachItem?: (item: DataType, key: ItemKey, index: number) => void
}

export type Config<DataType = DefaultDataItem> =
    | CollectionConfigInterface
    | ((collection: Collection<DataType>) => CollectionConfigInterface);

export class Collection<DataType = DefaultDataItem> {
    public agileInstance: () => Agile;

    public config: CollectionConfigInterface;

    public size: number = 0;  // The amount of data items stored inside this collection
    public data: { [key: string]: Item<DataType> } = {}; // Collection data is stored here
    public _key?: CollectionKey;

    public groups: { [key: string]: Group<any> } = {};
    public selectors: { [key: string]: Selector<any> } = {};

    constructor(agileInstance: Agile, config: Config<DataType>) {
        this.agileInstance = () => agileInstance;

        // If collection config is a function, execute and assign to config
        if (typeof config === 'function')
            config = config(this);

        // Assign defaults to config
        this.config = defineConfig<CollectionConfigInterface>(config, {
            primaryKey: 'id',
            groups: {},
            selectors: {},
            defaultGroupKey: 'default'
        });

        // Set Key
        this._key = this.config.key;

        // Create Groups
        if (config.groups)
            this.initSubInstances('groups');

        // Create Selectors
        if (config.selectors)
            this.initSubInstances('selectors');
    }

    public set key(value: StateKey | undefined) {
        this._key = value;
    }

    public get key(): StateKey | undefined {
        return this._key;
    }


    //=========================================================================================================
    // Init SubInstances
    //=========================================================================================================
    /**
     * Init SubInstances like groups or selectors
     */
    private initSubInstances(type: 'groups' | 'selectors') {
        const finalSubInstanceObject: any = {};
        let subInstanceObject: any = {};
        const subInstance = this.config[type];

        // Return empty object if subInstance doesn't exists
        if (!subInstance) return {};

        // if subInstance is array transform it to an object with the fitting class
        if (Array.isArray(subInstance)) {
            for (let i = 0; i < subInstance.length; i++) {
                let instance;
                switch (type) {
                    case "groups":
                        instance = new Group(this.agileInstance(), this, [], {key: subInstance[i]});
                        break;
                    case "selectors":
                        instance = new Selector(this, subInstance[i], {key: subInstance[i]});
                        break;
                    default:
                        instance = 'unknown';
                }
                subInstanceObject[subInstance[i]] = instance;
            }
        } else {
            subInstanceObject = subInstance;
        }

        // Loop through subInstance items
        const keys = Object.keys(subInstanceObject);
        // https://stackoverflow.com/questions/29285897/what-is-the-difference-between-for-in-and-for-of-statements-in-jav
        for (let key of keys) {
            // Create the sub instance in the final subInstance object
            finalSubInstanceObject[key] = subInstanceObject[key];

            // Set key to property name if it isn't set yet
            if (!finalSubInstanceObject[key].key)
                finalSubInstanceObject[key].key = key;
        }

        // Set Collection instance
        this[type] = finalSubInstanceObject;
    }


    //=========================================================================================================
    // Collect
    //=========================================================================================================
    /**
     * Collect iterable data into this collection.
     * Note: Data items must include a primary key (id)
     */
    public collect(items: DataType | Array<DataType>, groups?: GroupKey | Array<GroupKey>, options: CollectOptionsInterface<DataType> = {}) {
        const _items = normalizeArray<DataType>(items);
        const _groups = normalizeArray<GroupKey>(groups);
        const defaultGroupKey = this.config.defaultGroupKey || 'default';

        // Assign defaults to config
        options = defineConfig<CollectOptionsInterface>(options, {
            method: 'push',
        });

        // Add default group if it hasn't been added (default group contains all items)
        if (_groups.findIndex(groupName => groupName === defaultGroupKey) === -1)
            _groups.push(defaultGroupKey);

        // Create Group if it doesn't exist yet
        _groups.forEach(groupName => !this.groups[groupName] && this.createGroup(groupName));

        _items.forEach((item, index) => {
            // Save items into Collection
            let key = this.saveData(item, options.patch);

            // Return if key doesn't exist (something went wrong in saveData)
            if (!key) return;

            // Call forEachItem method
            if (options.forEachItem)
                options.forEachItem(item, key, index);

            // Add key to groups
            _groups.forEach(groupName => {
                if (key)
                    this.groups[groupName].add(key, {method: options.method})
            });
        });
    }


    //=========================================================================================================
    // Update
    //=========================================================================================================
    /**
     * * Update data by updateKey(id) in a Agile Collection
     */
    public update(updateKey: ItemKey, changes: DefaultDataItem, config: { addNewProperties?: boolean } = {}): State | undefined {
        // If item does not exist, return
        if (!this.data.hasOwnProperty(updateKey)) {
            console.error(`Agile: PrimaryKey '${updateKey} doesn't exist in collection `, this);
            return undefined;
        }

        // Assign defaults to config
        config = defineConfig(config, {
            addNewProperties: false
        });

        const itemState = this.data[updateKey];
        const currentItemValue = copy(itemState.value);
        const primaryKey = this.config.primaryKey || '';

        // Merge current Item value with changes
        const finalItemValue = flatMerge(currentItemValue, changes, {addNewProperties: config.addNewProperties});

        // Assign finalItemStateValue to nextState
        itemState.nextState = finalItemValue;

        // Set State to nextState
        itemState.set();

        // If data key changes update it properly
        if (currentItemValue[primaryKey] !== finalItemValue[primaryKey])
            this.updateDataKey(currentItemValue[primaryKey], finalItemValue[primaryKey]);

        // Rebuild all groups that includes the primaryKey
        this.rebuildGroupsThatIncludePrimaryKey(finalItemValue[primaryKey]);

        // Return data at primaryKey (updated State)
        return this.data[finalItemValue[primaryKey]];
    }


    //=========================================================================================================
    // Create Group
    //=========================================================================================================
    /**
     * Create a group instance on this collection
     */
    public createGroup(groupName: GroupKey, initialItems?: Array<ItemKey>): Group<DataType> {
        // Check if Group already exist
        if (this.groups.hasOwnProperty(groupName)) {
            console.warn(`Agile: The Group with the name ${groupName} already exists!`);
            return this.groups[groupName];
        }

        // Create new Group
        const group = new Group<DataType>(this.agileInstance(), this, initialItems, {key: groupName});

        // Add new Group to groups
        this.groups[groupName] = group;

        // Log Job
        if (this.agileInstance().config.logJobs)
            console.log(`Agile: Created Group called '${groupName}'`, group);

        return group;
    }


    //=========================================================================================================
    // Create Selector
    //=========================================================================================================
    /**
     * Create a selector instance on this collection
     */
    public createSelector(selectorName: SelectorKey, id: ItemKey): Selector<DataType> {
        // Check if Selector already exist
        if (this.selectors.hasOwnProperty(selectorName)) {
            console.warn(`Agile: The Selector with the name ${selectorName} already exists!`);
            return this.selectors[selectorName];
        }

        // Create new Selector
        const selector = new Selector<DataType>(this, id, {key: selectorName});

        // Add new Selector to selectors
        this.selectors[selectorName] = selector;

        // Log Job
        if (this.agileInstance().config.logJobs)
            console.log(`Agile: Created Selector called '${selectorName}'`, selector);

        return selector;
    }


    //=========================================================================================================
    // Get Group
    //=========================================================================================================
    /**
     * Return an group from this collection as Group instance (extends State)
     */
    public getGroup(groupName: GroupKey): Group<DataType> {
        if (this.groups[groupName]) {
            return this.groups[groupName];
        } else {
            console.warn(`Agile: Group with name ${groupName} doesn't exist!`);
            // Return empty group because useAgile can't handle undefined
            return new Group(this.agileInstance(), this, [], {key: 'dummy'});
        }
    }


    //=========================================================================================================
    // Get Selector
    //=========================================================================================================
    /**
     * Return an selector from this collection as Selector instance (extends State)
     */
    public getSelector(selectorName: SelectorKey): Selector<DataType> {
        if (this.selectors[selectorName]) {
            return this.selectors[selectorName];
        } else {
            console.warn(`Agile: Selector with name ${selectorName} doesn't exist!`);
            // Return empty group because useAgile can't handle undefined
            return new Selector(this, 'dummy', {key: 'dummy'});
        }
    }


    //=========================================================================================================
    // Remove
    //=========================================================================================================
    /**
     * Remove fromGroups or everywhere
     */
    public remove(primaryKeys: ItemKey | Array<ItemKey>) {
        return {
            fromGroups: (groups: Array<ItemKey> | ItemKey) => this.removeFromGroups(primaryKeys, groups),
            everywhere: () => this.removeData(primaryKeys)
        };
    }


    //=========================================================================================================
    // Find By Id
    //=========================================================================================================
    /**
     * Return an item from this collection by primaryKey as Item instance (extends State)
     */
    public findById(id: ItemKey): Item<DataType | undefined> {
        // If data doesn't exists return an item with the value undefined (not returning directly undefined because useAgile only accept States)
        if (!this.data.hasOwnProperty(id)) {
            return new Item<undefined>(this, undefined);
        }

        // Return data by id
        return this.data[id];
    }


    //=========================================================================================================
    // Get Value By Id
    //=========================================================================================================
    /**
     * Return a value from this collection by primaryKey
     */
    public getValueById(id: ItemKey): DataType | undefined {
        let data = this.findById(id);
        if (!data) return undefined;

        // Add state to foundState (for auto tracking used states in computed functions)
        if (this.agileInstance().runtime.trackState)
            this.agileInstance().runtime.foundStates.add(data);

        return data.value;
    }


    //=========================================================================================================
    // Group
    //=========================================================================================================
    /**
     * Create a group instance under this collection (can be used in function based config)
     */
    public Group(initialItems?: Array<string>, config?: GroupConfigInterface): Group<DataType> {
        return new Group<DataType>(this.agileInstance(), this, initialItems, config);
    }


    //=========================================================================================================
    // Selector
    //=========================================================================================================
    /**
     * Create a selector instance under this collection (can be used in function based config)
     */
    public Selector(initialSelection: ItemKey): Selector<DataType> {
        return new Selector<DataType>(this, initialSelection);
    }


    //=========================================================================================================
    // Update Data Key
    //=========================================================================================================
    /**
     * @internal
     * This will properly change the key of a collection item
     */
    private updateDataKey(oldKey: ItemKey, newKey: ItemKey): void {
        // If oldKey and newKey are the same, return
        if (oldKey === newKey) return;

        // Create copy of data
        const dataCopy = this.data[oldKey];

        // Delete old reference
        delete this.data[oldKey];

        // Apply the data into data with new key
        this.data[newKey] = dataCopy;

        // Update Groups
        for (let groupName in this.groups) {
            // Get Group
            const group = this.getGroup(groupName);

            // If Group does not contain oldKey, continue
            if (group.value.findIndex(key => key === oldKey) === -1) continue;

            // Replace the primaryKey at current index
            group.nextState.splice(group.nextState.indexOf(oldKey), 1, newKey);

            // Set State(Group) to nextState
            group.set();
        }

        // Update Selector
        for (let selectorName in this.selectors) {
            // Get Selector
            const selector = this.getSelector(selectorName);

            // If Selector doesn't watch on the oldKey, continue
            if (selector.id !== oldKey) continue;

            // Replace the oldKey with the newKey
            selector.select(newKey);
        }
    }


    //=========================================================================================================
    // Remove From Groups
    //=========================================================================================================
    /**
     * @internal
     * Deletes Data from Groups
     */
    public removeFromGroups(primaryKeys: ItemKey | Array<ItemKey>, groups: GroupKey | Array<GroupKey>) {
        const _primaryKeys = normalizeArray(primaryKeys);
        const _groups = normalizeArray(groups);

        _groups.forEach(groupKey => {
            // Return if group doesn't exist in collection
            if (!this.groups[groupKey]) {
                console.error(`Agile: Couldn't find group('${groupKey}) in collection`, this);
                return;
            }

            // Remove primaryKeys from Group
            _primaryKeys.forEach(primaryKey => {
                const group = this.getGroup(groupKey);
                group.remove(primaryKey);
            });
        });
    }


    //=========================================================================================================
    // Delete Data
    //=========================================================================================================
    /**
     * @internal
     * Deletes data directly form the collection
     */
    public removeData(primaryKeys: ItemKey | Array<ItemKey>) {
        const _primaryKeys = normalizeArray<ItemKey>(primaryKeys);
        const groups = Object.keys(this.groups)
        const dataKeys = Object.keys(this.data);

        _primaryKeys.forEach(primaryKey => {
            // Check if primaryKey exists in collection
            if (dataKeys.findIndex(key => primaryKey === key) === -1) {
                console.error(`Agile: Couldn't find primaryKey '${primaryKey} in collection`, this);
                return;
            }

            // Remove primaryKey from collection data
            delete this.data[primaryKey];

            // Decrease size
            this.size--;

            // Remove primaryKey from groups
            groups.forEach(groupKey => {
                this.groups[groupKey].remove(primaryKey);
            });
        });
    }


    //=========================================================================================================
    // Save Data
    //=========================================================================================================
    /**
     * @internal
     * Save data directly into the collection
     */
    public saveData(data: DataType, patch?: boolean): ItemKey | null {
        // Get primaryKey (default: 'id')
        const key = this.config.primaryKey || 'id';

        // Check if data is object if not return
        if (!isValidObject(data)) {
            console.error("Agile: Collections items has to be an object for now!");
            return null;
        }

        // Check if data has primaryKey
        // @ts-ignore
        if (!data.hasOwnProperty(key)) {
            console.error("Agile: Collections items need a own primaryKey (default = id)");
            return null;
        }

        // Create reference of data at the data key
        // @ts-ignore
        let item: Item<DataType> = this.data[data[key]];

        // If the data already exists and config is to patch, patch data
        if (item && patch)
            item.patch(data);
        // If the data already exists and no config, overwrite data
        else if (item)
            item.set(data);
        // If data does not exist.. create new Data set
        else
            item = new Item<DataType>(this, data);

        // @ts-ignore
        this.data[data[key]] = item;

        // Increase size
        this.size++;

        // @ts-ignore
        return data[key];
    }


    //=========================================================================================================
    // Rebuild Groups That Includes Primary Key
    //=========================================================================================================
    /**
     * @internal
     * Rebuild the Groups which contains the primaryKey
     */
    public rebuildGroupsThatIncludePrimaryKey(primaryKey: ItemKey): void {
        for (let groupKey in this.groups) {
            // Get Group
            const group = this.getGroup(groupKey);

            // Check if group contains primaryKey if so rebuild it
            if (group.has(primaryKey))
                group.set();
        }
    }
}
