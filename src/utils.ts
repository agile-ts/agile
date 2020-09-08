import {State} from "./state";
import Agile from "./agile";
import {Event} from "./event";
import {Collection} from "./collection";


//=========================================================================================================
// Copy
//=========================================================================================================
/**
 * Copy an array or object.. without any dependencies
 */

export function copy<T = any>(value: T): T;
export function copy<T extends Array<T>>(value: T): T[];
export function copy<T = any>(value: T): T | T[] {
    if (Array.isArray(value))
        return [...value];

    if (isValidObject(value))
        return {...value};

    return value;
}


//=========================================================================================================
// Is Valid Object
//=========================================================================================================
/**
 * Checks if an Object is an valid object for Agile
 * https://stackoverflow.com/questions/12996871/why-does-typeof-array-with-objects-return-object-and-not-array
 */
export function isValidObject(value: any): boolean {
    function isHTMLElement(obj: any) {
        try {
            return obj instanceof HTMLElement;
        } catch (e) {
            return typeof obj === 'object' && obj.nodeType === 1 && typeof obj.style === 'object' && typeof obj.ownerDocument === 'object';
        }
    }

    return value !== null && typeof value === 'object' && !isHTMLElement(value) && !Array.isArray(value);
}


//=========================================================================================================
// Normalize Array
//=========================================================================================================
/**
 * Convert item into an array
 */
export function normalizeArray<DataType = any>(items?: DataType | Array<DataType>): Array<DataType> {
    // Return empty array if no items
    if (!items)
        return [];

    return Array.isArray(items) ? items : [items as DataType];
}


//=========================================================================================================
// Get Instance
//=========================================================================================================
/**
 * Tries to get AgileInstance from instance(State, Collection)
 */
export function getAgileInstance(instance: any): Agile | null {
    try {
        // Return state agileInstance
        if (instance instanceof State)
            return instance.agileInstance();

        if(instance instanceof Event)
            return instance.agileInstance();

        if(instance instanceof Collection)
            return instance.agileInstance();

        // Return the globalBind agile instance
        // @ts-ignore
        return globalThis.__agile;
    } catch (e) {
        // fail silently
    }

    return null
}


//=========================================================================================================
// Is Function
//=========================================================================================================
/**
 * Checks if func is a function
 */
export function isFunction(func: any) {
    return typeof func === 'function';
}


//=========================================================================================================
// Is Async Function
//=========================================================================================================
/**
 * Checks if func is a async function
 */
export function isAsyncFunction(func: any) {
    return isFunction(func) && func.constructor.name === 'AsyncFunction';
}


//=========================================================================================================
// Is Valid Url
// https://stackoverflow.com/questions/5717093/check-if-a-javascript-string-is-a-url
//=========================================================================================================
/**
 * Checks if url is valid
 */
export function isValidUrl(url: string): boolean {
    const pattern = new RegExp('^(https?:\\/\\/)?' + // protocol
        '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
        '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
        '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
        '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
        '(\\#[-a-z\\d_]*)?$', 'i'); // fragment locator
    return pattern.test(url);
}


//=========================================================================================================
// Is Json String
//=========================================================================================================
/**
 * Checks if value is a valid JsonString
 */
export function isJsonString(value: any) {
    try {
        JSON.parse(value);
    } catch (e) {
        return false;
    }
    return true;
}

//=========================================================================================================
// Define Config
//=========================================================================================================
/**
 * Will create a config (config) and merges default values (default) into this config (config)
 */
export function defineConfig<C>(config: C, defaults: object): C {
    return {...defaults, ...config};
}


//=========================================================================================================
// Flat Merge
//=========================================================================================================
/**
 * Merged the items flat into the object
 */
export function flatMerge<DataType = Object>(source: DataType, changes: Object, config: { addNewProperties?: boolean } = {}): DataType {
    // Copy Source to avoid reference
    const _source = copy<DataType>(source);

    // Loop through changes object and merge changes into source
    let keys = Object.keys(changes);
    keys.forEach(property => {
        // @ts-ignore https://stackoverflow.com/questions/18452920/continue-in-cursor-foreach
        if (!config.addNewProperties && !_source[property]) return;

        // @ts-ignore
        _source[property] = changes[property];
    });

    return _source;
}
