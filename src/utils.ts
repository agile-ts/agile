import {State} from "./state";
import Agile from "./agile";


//=========================================================================================================
// Copy
//=========================================================================================================
/**
 * Copy an array or object.. without any dependencies
 */
export const copy = (val: any) => {
    // Keep in mind: https://stackoverflow.com/questions/12996871/why-does-typeof-array-with-objects-return-object-and-not-array
    if (Array.isArray(val))
        return [...val];

    if (typeof val === 'object')
        return {...val};
};


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
 * Get the agileInstance of the State.. and if that doesn't exist get the global AgileInstance
 */
export function getAgileInstance(state: State): Agile | null {
    try {
        // Return state agileInstance if it exists
        if (state.agileInstance)
            return state.agileInstance();

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
export function flatMerge<DataType = Object>(source: DataType, changes: Object): DataType {
    let keys = Object.keys(changes);
    keys.forEach(property => {
        // @ts-ignore
        source[property] = changes[property];
    });

    return source;
}
