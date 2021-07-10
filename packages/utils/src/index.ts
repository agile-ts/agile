//=========================================================================================================
// Copy
//=========================================================================================================
/**
 * @internal
 * Creates a fresh copy of an Array/Object
 * https://www.samanthaming.com/tidbits/70-3-ways-to-clone-objects/
 * @param value - Array/Object that gets copied
 */
export function copy<T = any>(value: T): T {
  // Extra checking 'value == null' because 'typeof null === object'
  if (value == null || typeof value !== 'object') return value;

  // Ignore everything that is no object or array but has the type of an object (e.g. classes)
  const valConstructorName = Object.getPrototypeOf(
    value
  ).constructor.name.toLowerCase();
  if (valConstructorName !== 'object' && valConstructorName !== 'array')
    return value;

  let temp;
  const newObject: any = Array.isArray(value) ? [] : {};
  for (const property in value) {
    temp = value[property];
    newObject[property] = copy(temp);
  }
  return newObject as T;
}

//=========================================================================================================
// Is Valid Object
//=========================================================================================================
/**
 * @internal
 * Checks if passed value is a valid Object
 * https://stackoverflow.com/questions/12996871/why-does-typeof-array-with-objects-return-object-and-not-array
 * @param value - Value that is tested for its correctness
 * @param considerArray - Whether Arrays should be considered as object
 */
export function isValidObject(value: any, considerArray = false): boolean {
  function isHTMLElement(obj: any) {
    try {
      return obj instanceof HTMLElement;
    } catch (e) {
      return (
        typeof obj === 'object' &&
        obj.nodeType === 1 &&
        typeof obj.style === 'object' &&
        typeof obj.ownerDocument === 'object'
      );
    }
  }

  return (
    value !== null &&
    typeof value === 'object' &&
    !isHTMLElement(value) &&
    (considerArray ? true : !Array.isArray(value))
  );
}

//=========================================================================================================
// Includes Array
//=========================================================================================================
/**
 * @internal
 * Check if array1 contains all elements of array2
 * @param array1 - Array 1
 * @param array2 - Array 2
 */
export function includesArray<DataType = any>(
  array1: Array<DataType>,
  array2: Array<DataType>
): boolean {
  return array2.every((element) => array1.includes(element));
}

//=========================================================================================================
// Normalize Array
//=========================================================================================================
/**
 * @internal
 * Transforms Item/s to an Item Array
 * @param items - Item/s that gets transformed to an Array
 * @param config - Config
 */
export function normalizeArray<DataType = any>(
  items?: DataType | Array<DataType>,
  config: { createUndefinedArray?: boolean } = {}
): Array<DataType> {
  config = {
    createUndefinedArray: false, // If it should return [] or [undefined] if the passed Item is undefined
    ...config,
  };
  if (items == null && !config.createUndefinedArray) return [];
  return Array.isArray(items) ? items : [items as DataType];
}

//=========================================================================================================
// Is Function
//=========================================================================================================
/**
 * @internal
 * Checks if value is a function
 * @param value - Value that gets tested if its a function
 */
export function isFunction(value: any): boolean {
  return typeof value === 'function';
}

//=========================================================================================================
// Is Async Function
//=========================================================================================================
/**
 * @internal
 * Checks if value is an async function
 * @param value - Value that gets tested if its an async function
 */
export function isAsyncFunction(value: any): boolean {
  const valueString = value.toString();
  return (
    isFunction(value) &&
    (value.constructor.name === 'AsyncFunction' ||
      valueString.includes('__awaiter'))
  );
}

//=========================================================================================================
// Is Json String
//=========================================================================================================
/**
 * @internal
 * Checks if value is valid JsonString
 * @param value - Value that gets checked
 */
export function isJsonString(value: any): boolean {
  if (typeof value !== 'string') return false;
  try {
    JSON.parse(value);
  } catch (e) {
    return false;
  }
  return true;
}

//=========================================================================================================
// Flat Merge
//=========================================================================================================
/**
 * @internal
 * @param addNewProperties - Adds new properties to source Object
 */
export interface FlatMergeConfigInterface {
  addNewProperties?: boolean;
}

/**
 * @internal
 * Merges items into object, be aware that the merge will only happen at the top level of the object.
 * Initially it adds new properties of the changes object into the source object.
 * @param source - Source object
 * @param changes - Changes that get merged into the source object
 * @param config - Config
 */
export function flatMerge<DataType = Object>(
  source: DataType,
  changes: Object,
  config: FlatMergeConfigInterface = {}
): DataType {
  config = {
    addNewProperties: true,
    ...config,
  };

  // Copy Source to avoid References
  const _source = copy<DataType>(source);
  if (_source == null) return _source;

  // Merge Changes Object into Source Object
  const keys = Object.keys(changes);
  keys.forEach((property) => {
    if (
      (!config.addNewProperties && _source[property] != null) ||
      config.addNewProperties
    )
      _source[property] = changes[property];
  });

  return _source;
}

//=========================================================================================================
// Equals
//=========================================================================================================
/**
 * @internal
 * Check if two values are equal
 * @param value1 - First Value
 * @param value2 - Second Value
 */
export function equal(value1: any, value2: any): boolean {
  return (
    value1 === value2 ||
    // Checking if 'value1' and 'value2' is typeof object before
    // using the JSON.stringify comparison to optimize the performance
    (typeof value1 === 'object' &&
      typeof value2 === 'object' &&
      JSON.stringify(value1) === JSON.stringify(value2))
  );
}

//=========================================================================================================
// Not Equals
//=========================================================================================================
/**
 * @internal
 * Checks if two values aren't equal
 * @param value1 - First Value
 * @param value2 - Second Value
 */
export function notEqual(value1: any, value2: any): boolean {
  return !equal(value1, value2);
}

//=========================================================================================================
// Generate Id
//=========================================================================================================
/**
 * @internal
 * Generates random Id
 * @param length - Length of generated Id
 */
export function generateId(length?: number): string {
  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  let result = '';
  if (!length) length = 5;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

//=========================================================================================================
// Create Array From Object
//=========================================================================================================
/**
 * @internal
 * Transforms Object to Array
 * @param object - Object that gets transformed
 */
export function createArrayFromObject<P = any>(object: {
  [key: string]: P;
}): Array<{ key: string; instance: P }> {
  const array: Array<{ key: string; instance: P }> = [];
  for (const key in object) {
    array.push({
      key: key,
      instance: object[key],
    });
  }
  return array;
}

//=========================================================================================================
// Clone
//=========================================================================================================
/**
 * @internal
 * Clones a Class
 * @param instance - Instance of Class you want to clone
 */
export function clone<T = any>(instance: T): T {
  // Clone Class
  const objectCopy: T = Object.create(Object.getPrototypeOf(instance));
  const objectClone = Object.assign(objectCopy, instance);

  // Copy Properties of Class to remove flat references
  for (const key in objectClone) objectClone[key] = copy(objectClone[key]);

  return objectClone;
}

//=========================================================================================================
// Remove Properties
//=========================================================================================================
/**
 * @internal
 * Removes properties from Object
 * @param object - Object from which the properties get removed
 * @param properties - Properties that get removed from the object
 */
export function removeProperties<T = Object>(
  object: T,
  properties: Array<string>
): T {
  const copiedObject = copy(object);
  properties.map((property) => delete copiedObject[property]);
  return copiedObject;
}
