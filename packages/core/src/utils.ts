import { State, Agile, Event, Collection } from "./internal";

//=========================================================================================================
// Copy
//=========================================================================================================
/**
 * Creates a fresh copy of an Array or Object
 * @param {any | Array<any>} value - Array/Object which you want to copy
 */
export function copy<T = any>(value: T): T;
export function copy<T extends Array<T>>(value: T): T[];
export function copy<T = any>(value: T): T | T[] {
  if (Array.isArray(value)) return [...value];
  if (isValidObject(value)) return { ...value };
  return value;
}

//=========================================================================================================
// Is Valid Object
//=========================================================================================================
/**
 * Checks if an Value is a valid Object
 * https://stackoverflow.com/questions/12996871/why-does-typeof-array-with-objects-return-object-and-not-array
 * @param {any} value - Value you want to check if its a valid Object
 */
export function isValidObject(value: any): boolean {
  function isHTMLElement(obj: any) {
    try {
      return obj instanceof HTMLElement;
    } catch (e) {
      return (
        typeof obj === "object" &&
        obj.nodeType === 1 &&
        typeof obj.style === "object" &&
        typeof obj.ownerDocument === "object"
      );
    }
  }

  return (
    value !== null &&
    typeof value === "object" &&
    !isHTMLElement(value) &&
    !Array.isArray(value)
  );
}

//=========================================================================================================
// Normalize Array
//=========================================================================================================
/**
 * Will transform items into an Array
 * @param {DataType | Array<DataType>} items - Item/s you want to transform into an array
 */
export function normalizeArray<DataType = any>(
  items?: DataType | Array<DataType>
): Array<DataType> {
  // Return empty array if no items
  if (!items) return [];

  return Array.isArray(items) ? items : [items as DataType];
}

//=========================================================================================================
// Get Instance
//=========================================================================================================
/**
 * Tries to get the agileInstance from the provided instances
 * If no agileInstance found it will return the global bound agileInstance
 * @param {any} instance - Instance which could hold an AgileInstance
 */
export function getAgileInstance(instance: any): Agile | null {
  try {
    // Return state agileInstance
    if (instance instanceof State) return instance.agileInstance();

    if (instance instanceof Event) return instance.agileInstance();

    if (instance instanceof Collection) return instance.agileInstance();

    // Return a global bound agileInstance (set in first instantiation of Agile)
    return globalThis.__agile;
  } catch (e) {
    // fail silently
  }
  return null;
}

//=========================================================================================================
// Is Function
//=========================================================================================================
/**
 * Checks if @func is an function
 * @param {any} value - Value you want to check if its a function
 */
export function isFunction(value: any): boolean {
  return typeof value === "function";
}

//=========================================================================================================
// Is Async Function
//=========================================================================================================
/**
 * Checks if func is an async function
 * @param {any} value - Value you want to check if its a async function
 */
export function isAsyncFunction(value: any): boolean {
  return isFunction(value) && value.constructor.name === "AsyncFunction";
}

//=========================================================================================================
// Is Valid Url
//=========================================================================================================
/**
 * checks the correctness of the url
 * https://stackoverflow.com/questions/5717093/check-if-a-javascript-string-is-a-url
 * @param {string} url - Url you want to check if its valid
 */
export function isValidUrl(url: string): boolean {
  const pattern = new RegExp(
    "^(https?:\\/\\/)?" + // protocol
    "((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|" + // domain name
    "((\\d{1,3}\\.){3}\\d{1,3}))" + // OR ip (v4) address
    "(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*" + // port and path
    "(\\?[;&a-z\\d%_.~+=-]*)?" + // query string
      "(\\#[-a-z\\d_]*)?$",
    "i"
  );
  return pattern.test(url);
}

//=========================================================================================================
// Is Json String
//=========================================================================================================
/**
 * Checks if value is a valid JsonString
 * @param {any} value - Value you want to check if its an JsonString
 */
export function isJsonString(value: any): boolean {
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
 * Merges default values into config
 * @param {ConfigInterface} config - Config which should receive the default values
 * @param {Object} defaults - Default values which will be merged into config
 */
export function defineConfig<ConfigInterface = Object>(
  config: ConfigInterface,
  defaults: Object
): ConfigInterface {
  return { ...defaults, ...config };
}

//=========================================================================================================
// Flat Merge
//=========================================================================================================
/**
 * @param {boolean} addNewProperties - Add new properties to source Object or not
 */
export interface FlatMergeConfigInterface {
  addNewProperties?: boolean;
}

/**
 * Merge items into object but only at the top level
 * @param {DataType} source - Source object
 * @param {Object} changes - Changes you want to merge into the source object
 * @param {Object} config - Config
 */
export function flatMerge<DataType = Object>(
  source: DataType,
  changes: Object,
  config: FlatMergeConfigInterface = {}
): DataType {
  // Copy Source to avoid references
  const _source = copy<DataType>(source);
  if (!_source) return _source;

  // Loop through source object an merge changes into it
  let keys = Object.keys(changes);
  keys.forEach((property) => {
    if (!config.addNewProperties && !_source[property]) return;
    _source[property] = changes[property];
  });

  return _source;
}

//=========================================================================================================
// Equals
//=========================================================================================================
/**
 * Check if 2 values are equal
 * @param {any} value1 - First Value
 * @param {any} value2 - Second Value
 */
export function equal(value1: any, value2: any): boolean {
  return value1 === value2 || JSON.stringify(value1) === JSON.stringify(value2);
}

//=========================================================================================================
// Not Equals
//=========================================================================================================
/**
 * Check if 2 values aren't equal
 * @param {any} value1 - First Value
 * @param {any} value2 - Second Value
 */
export function notEqual(value1: any, value2: any): boolean {
  return value1 !== value2 && JSON.stringify(value1) !== JSON.stringify(value2);
}

//=========================================================================================================
// Generate Id
//=========================================================================================================
/**
 * Generates random id
 * @param {number} length - Length of generated Id
 */
export function generateId(length?: number) {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;
  let result = "";
  if (!length) length = 5;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}
