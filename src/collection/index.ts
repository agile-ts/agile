import Agile from "../agile";
import Data from "./data";
import {Group} from "./group";
import {Selector} from "./selector";
import {defineConfig} from "../utils";

export type DefaultDataItem = { [key: string]: any };

export interface CollectionConfig {
    groups?: { [key: string]: Group<any> }
    selectors?: { [key: string]: Selector<any> }
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

    // public groups: this['config']['groups'];
    // public selectors: this['config']['selectors'];

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
