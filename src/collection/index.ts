import Agile from "../agile";
import Item from "./item";
import {Group, GroupConfigInterface, GroupKey} from "./group";
import {Selector, SelectorKey} from "./selector";
import {copy, defineConfig, flatMerge, isValidObject, normalizeArray} from "../utils";
import {State, StateKey} from "../state";
import {StorageKey} from "../storage";
import {persistValue, removeItem, setItem} from "./perstist";

export type DefaultDataItem = { [key: string]: any };
export type CollectionKey = string | number;
export type ItemKey = string | number; // The key of an item in a collection

export interface CollectionConfigInterface {
    groups?: { [key: string]: Group<any> } | string[]
    selectors?: { [key: string]: Selector<any> } | string[]
    key?: CollectionKey // should be a unique key/name which identifies the collection
    primaryKey?: string // the primaryKey of an item (default is id)
    defaultGroupKey?: ItemKey // The defaultGroupKey(Name).. in which all collected items get stored
}

export interface CollectOptionsInterface<DataType = any> {
    patch?: boolean
    method?: 'push' | 'unshift'
    forEachItem?: (item: DataType, key: ItemKey, index: number) => void
    background?: boolean
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
    public isPersistCollection: boolean = false; // Is saved in storage

    public groups: { [key: string]: Group<any> } = {};
    public selectors: { [key: string]: Selector<any> } = {};

    constructor(agileInstance: Agile, config: Config<DataType> = {}) {
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
        this.initSubInstances('groups');

        // Create Selectors
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
        const subInstance = {...this.config[type]} || {};
        let subInstanceObject: any = {};

        // If subInstance is array transform it to an object with the fitting class
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
            // If subInstance is Object.. set subInstanceObject to subInstance
            subInstanceObject = subInstance;
        }

        // If groups.. add default group
        if (type === "groups") {
            if (!subInstanceObject[this.config.defaultGroupKey || 'default'])
                subInstanceObject[this.config.defaultGroupKey || 'default'] = new Group(this.agileInstance(), this, [], {key: this.config.defaultGroupKey || 'default'});
        }

        const keys = Object.keys(subInstanceObject);
        for (let key of keys) {
            // Set key to property name if it isn't set yet
            if (!subInstanceObject[key].key)
                subInstanceObject[key].key = key;
        }

        // Set Collection instance
        this[type] = subInstanceObject;
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

        // Assign defaults to options
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
            let key = this.saveData(item, {patch: options.patch, background: options.background});

            // Return if key doesn't exist (something went wrong in saveData)
            if (!key) return;

            // Call forEachItem method
            if (options.forEachItem)
                options.forEachItem(item, key, index);

            // Add key to groups
            _groups.forEach(groupName => {
                // @ts-ignore
                this.groups[groupName].add(key, {method: options.method, background: options.background})
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
        itemState.ingest();

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
            // Return empty group because it might get annoying to handle with undefined (can check if it exists with group.exists)
            const group = new Group(this.agileInstance(), this, [], {key: 'dummy'});
            group.isPlaceholder = true;
            return group;
        }
    }


    //=========================================================================================================
    // Get Selector
    //=========================================================================================================
    /**
     * Return an selector from this collection as Selector instance (extends State)
     */
    public getSelector(selectorName: SelectorKey): Selector<DataType> | undefined {
        if (this.selectors[selectorName]) {
            return this.selectors[selectorName];
        } else
            console.warn(`Agile: Selector with name ${selectorName} doesn't exist!`);
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
    public findById(id: ItemKey): Item<DataType> | undefined {
        if (!this.data.hasOwnProperty(id) || !this.data[id].exists)
            return undefined;

        // Add state to foundState (for auto tracking used states in computed functions)
        if (this.agileInstance().runtime.trackState)
            this.agileInstance().runtime.foundStates.add(this.data[id]);

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

        return data.value;
    }


    //=========================================================================================================
    // Persist
    //=========================================================================================================
    /**
     * Saves the collection in the local storage or in a own configured storage
     * @param key - the storage key (if no key passed it will take the collection key)
     */
    public persist(key?: StorageKey): this {
        persistValue(this, key).then((value) => {
            this.isPersistCollection = value
        });
        return this;
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
            group.ingest();
        }

        // Update Selector
        for (let selectorName in this.selectors) {
            // Get Selector
            const selector = this.getSelector(selectorName);
            if (!selector) continue;

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
        const groupKeys = Object.keys(this.groups);
        const selectorKeys = Object.keys(this.selectors);
        const itemKeys = Object.keys(this.data);

        _primaryKeys.forEach(itemKey => {
            // Check if primaryKey exists in collection
            if (itemKeys.findIndex(key => itemKey === key) === -1) {
                console.error(`Agile: Couldn't find primaryKey '${itemKey} in collection`, this);
                return;
            }

            // Remove primaryKey from collection data
            delete this.data[itemKey];

            // Decrease size
            this.size--;

            // Remove primaryKey from Groups
            groupKeys.forEach(groupKey => {
                this.groups[groupKey].remove(itemKey);
            });

            // Remove Selectors with primaryKey
            selectorKeys.forEach(selectorKey => {
                delete this.selectors[selectorKey];
            });

            // Storage
            removeItem(itemKey, this);
        });
    }


    //=========================================================================================================
    // Save Data
    //=========================================================================================================
    /**
     * @internal
     * Save data directly into the collection
     */
    public saveData(data: DataType, options: { patch?: boolean, background?: boolean } = {}): ItemKey | null {
        // Transform data to any because otherwise I have many type errors (because not defined object)
        // https://stackoverflow.com/questions/57350092/string-cant-be-used-to-index-type
        const _data = data as any;

        // Assign defaults to options
        options = defineConfig(options, {
            patch: false,
            background: false,
        });

        // Get primaryKey (default: 'id')
        const primaryKey = this.config.primaryKey || 'id';
        const itemKey = _data[primaryKey];

        // Check if data is object if not return
        if (!isValidObject(_data)) {
            console.error("Agile: Collections items has to be an object for now!");
            return null;
        }

        // Check if data has primaryKey
        if (!_data.hasOwnProperty(primaryKey)) {
            console.error("Agile: Collections items need a own primaryKey. Here " + this.config.primaryKey);
            return null;
        }

        // Create reference of data at the data key
        let item: Item<DataType> = this.data[itemKey];

        // If the data already exists and config is to patch, patch data
        if (item && options.patch)
            item.patch(_data, {background: options.background});
        // If the data already exists and no config, overwrite data
        else if (item)
            item.set(_data, {background: options.background});
        // If data does not exist.. create new Item set and increase the size
        else{
            item = new Item<DataType>(this, _data);
            this.size++;
        }

        // Set item at data itemKey
        this.data[itemKey] = item;

        // Storage
        setItem(itemKey, this);

        return itemKey;
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
                group.ingest();
        }
    }
}
