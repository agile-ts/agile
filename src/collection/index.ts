import Agile from "../agile";
import Item from "./item";
import {Group, GroupConfigInterface, GroupKey, PrimaryKey} from "./group";
import {Selector} from "./selector";
import {defineConfig, isValidObject, normalizeArray} from "../utils";

export type DefaultDataItem = { [key: string]: any };
export type CollectionKey = string | number;

export interface CollectionConfigInterface {
    groups?: { [key: string]: Group<any> } | string[]
    selectors?: { [key: string]: Selector<any> } | string[]
    key?: CollectionKey // should be a unique key/name which identifies the collection
    primaryKey?: string // the primaryKey of an item (default is id)
    defaultGroupKey?: string // The defaultGroup.. in which all collected items get stored
    // indexAll?: boolean
}

export interface CollectOptionsInterface<DataType = any> {
    patch?: boolean
    method?: 'push' | 'unshift'
    forEachItem?: (item: DataType, key: PrimaryKey, index: number) => void
}

export type Config<DataType = DefaultDataItem> =
    | CollectionConfigInterface
    | ((collection: Collection<DataType>) => CollectionConfigInterface);

export class Collection<DataType = DefaultDataItem> {
    public agileInstance: () => Agile;

    public config: CollectionConfigInterface;

    public size: number = 0;  // The amount of data items stored inside this collection
    public data: { [key: string]: Item<DataType> } = {}; // Collection data is stored here
    public defaultGroupKey: string = 'default'; // The Group key which contains all collection items
    // public hasPrimaryKey: boolean; // Checks if the user has passed a primaryKey

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
            selectors: {}
        });

        // Set Default Group Key
        if(this.config.defaultGroupKey)
            this.defaultGroupKey = this.config.defaultGroupKey;

        // Create Groups
        if (config.groups)
            this.initSubInstances('groups');

        // Create Selectors
        if (config.selectors)
            this.initSubInstances('selectors');
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
                        instance = new Selector();
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

        // Assign defaults to config
        options = defineConfig<CollectOptionsInterface>(options, {
            method: 'push',
        });

        // Add default group if it hasn't been added (default group contains all items)
        if (_groups.findIndex(groupName => groupName === this.defaultGroupKey) === -1)
            _groups.push(this.defaultGroupKey);

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
    // Create Group
    //=========================================================================================================
    /**
     * Create a group instance on this collection
     */
    public createGroup(groupName: GroupKey, initialItems?: Array<PrimaryKey>): Group<DataType> {
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
            // Return empty group
            return new Group(this.agileInstance(), this, [], {key: 'dummy'});
        }
    }


    //=========================================================================================================
    // Group
    //=========================================================================================================
    /**
     * Create a group instance under this collection
     */
    public Group(initialItems?: Array<string>, config?: GroupConfigInterface): Group<DataType> {
        return new Group<DataType>(this.agileInstance(), this, initialItems, config);
    }


    //=========================================================================================================
    // Selector
    //=========================================================================================================
    /**
     * Create a selector instance under this collection
     */
    public Selector(initialSelection?: string | number): Selector<DataType> {
        return new Selector<DataType>();
    }


    //=========================================================================================================
    // Save Data
    //=========================================================================================================
    /**
     * @internal
     * Save data directly into collection storage
     */
    public saveData(data: DataType, patch?: boolean): PrimaryKey | null {
        // Get primaryKey (default: 'id')
        const key = this.config.primaryKey;

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
}
