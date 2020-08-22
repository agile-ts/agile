import Agile from "../agile";
import Data from "./data";
import {Group} from "./group";
import {Selector} from "./selector";
import {defineConfig} from "../utils";

export type DefaultDataItem = { [key: string]: any };

export interface CollectionConfig {
    groups?: { [key: string]: Group<any> } | string[]
    selectors?: { [key: string]: Selector<any> } | string[]
    key?: string
    primaryKey?: string
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
    public data: { [key: string]: Data<DataType> } = {};

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
                        instance = new Group();
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
        }

        // Set Collection instance
        this[type] = finalSubInstanceObject;
    }


    //=========================================================================================================
    // Group
    //=========================================================================================================
    /**
     * Create a group instance under this collection
     */
    public Group(initialIndex?: Array<string>): Group<DataType> {
        return new Group<DataType>();
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
