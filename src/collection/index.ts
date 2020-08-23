import Agile from "../agile";
import Item from "./item";
import {Group, GroupConfigInterface, GroupKey, PrimaryKey} from "./group";
import {Selector} from "./selector";
import {defineConfig} from "../utils";

export type DefaultDataItem = { [key: string]: any };
export type CollectionKey = string | number;

export interface CollectionConfig {
    groups?: { [key: string]: Group<any> } | string[]
    selectors?: { [key: string]: Selector<any> } | string[]
    key?: CollectionKey // should be a unique key/name which identifies the collection
    primaryKey?: string // the primaryKey of an item (default is id)
    indexAll?: boolean
}

export type Config<DataType = DefaultDataItem> =
    | CollectionConfig
    | ((collection: Collection<DataType>) => CollectionConfig);

export class Collection<DataType = DefaultDataItem> {
    public agileInstance: () => Agile;

    public config: CollectionConfig;

    // The amount of data items stored inside this collection
    public size: number = 0;

    // Collection data is stored here
    public data: { [key: string]: Item<DataType> } = {};

    public groups: { [key: string]: Group<any> } = {};
    public selectors: { [key: string]: Selector<any> } = {};

    constructor(agileInstance: Agile, config: Config<DataType>) {
        this.agileInstance = () => agileInstance;

        // If collection config is a function, execute and assign to config
        if (typeof config === 'function')
            config = config(this);

        // Assign defaults to config
        this.config = defineConfig<CollectionConfig>(config, {
            primaryKey: 'id',
            groups: {},
            selectors: {}
        });

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
        for (let i = 0; i < keys.length; i++) {
            // Create the sub instance in the final subInstance object
            finalSubInstanceObject[keys[i]] = subInstanceObject[keys[i]];

            // Set key to property name if it isn't set yet
            if (!finalSubInstanceObject[keys[i]].key)
                finalSubInstanceObject[keys[i]] = keys[i];
        }

        // Set Collection instance
        this[type] = finalSubInstanceObject;
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

        return group;
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
}
