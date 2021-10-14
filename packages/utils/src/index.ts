/**
 * Creates a fresh (deep) copy of the specified value.
 * https://www.samanthaming.com/tidbits/70-3-ways-to-clone-objects/
 *
 * @public
 * @param value - Value to be copied.
 */
export function copy<T = any>(value: T): T {
  // Extra checking 'value == null' because 'typeof null === object'
  if (value == null || typeof value !== 'object') return value;

  // Ignore everything that is no object or array but has the type of an object (e.g. classes)
  const valConstructorName =
    Object.getPrototypeOf(value).constructor.name.toLowerCase();
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

/**
 * Checks whether the specified value is a valid object.
 * https://stackoverflow.com/questions/12996871/why-does-typeof-array-with-objects-return-object-and-not-array
 *
 * @public
 * @param value - Value
 * @param considerArray - Whether to considered an array as an object.
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

/**
 * Checks whether 'array1' contains all elements of 'array2'.
 *
 * @public
 * @param array1 - Array 1
 * @param array2 - Array 2
 */
export function includesArray<DataType = any>(
  array1: Array<DataType>,
  array2: Array<DataType>
): boolean {
  return array2.every((element) => array1.includes(element));
}

/**
 * Transforms Item/s into an array of Items.
 *
 * @public
 * @param items - Item/s to be transformed into an array of Items.
 * @param createUndefinedArray - Whether to return `[undefined]` instead of `[]` if the specified Item is `undefined`.
 */
export function normalizeArray<DataType = any>(
  items?: DataType | Array<DataType>,
  createUndefinedArray = false
): Array<DataType> {
  if (items == null && !createUndefinedArray) return [];
  return Array.isArray(items) ? items : [items as DataType];
}

/**
 * Checks whether the specified function is a function.
 *
 * @public
 * @param value - Value to be checked
 */
export function isFunction(value: any): boolean {
  return typeof value === 'function';
}

/**
 * Checks whether the specified function is an async function.
 *
 * @public
 * @param value - Value to be checked.
 */
export function isAsyncFunction(value: any): boolean {
  const valueString = value.toString();
  return (
    isFunction(value) &&
    (value.constructor.name === 'AsyncFunction' ||
      valueString.includes('__awaiter'))
  );
}

/**
 * Checks whether the specified value is a valid JSON string
 *
 * @public
 * @param value - Value to be checked.
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

/**
 * Merges the default values object ('defaults') into the configuration object ('config').
 *
 * @public
 * @param config - Configuration object to merge the default values in.
 * @param defaults - Default values object to be merged into the configuration object.
 * @param overwriteUndefinedProperties - Whether to overwrite 'undefined' set properties with default values.
 */
export function defineConfig<ConfigInterface = Object>(
  config: ConfigInterface,
  defaults: Object,
  overwriteUndefinedProperties = true
): ConfigInterface {
  const shallowCopiedConfig = { ...config };

  for (const defaultKey in defaults) {
    if (
      !Object.prototype.hasOwnProperty.call(shallowCopiedConfig, defaultKey) ||
      (overwriteUndefinedProperties &&
        shallowCopiedConfig[defaultKey] === undefined)
    )
      shallowCopiedConfig[defaultKey] = defaults[defaultKey];
  }

  return shallowCopiedConfig;
}

export interface FlatMergeConfigInterface {
  /**
   *
   * Whether to add new properties (properties that doesn't exist in the source object yet) to the source object.
   * @default true
   */
  addNewProperties?: boolean;
}

/**
 * Merges the 'changes' object into the 'source' object at top level.
 *
 * @public
 * @param source - Source object
 * @param changes - Changes object to be merged into the source object
 * @param config - Configuration object
 */
export function flatMerge<DataType = Object>(
  source: DataType,
  changes: Object,
  config: FlatMergeConfigInterface = {}
): DataType {
  config = defineConfig(config, {
    addNewProperties: true,
  });

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

/**
 * Checks whether the two specified values are equivalent.
 *
 * @public
 * @param value1 - First value.
 * @param value2 - Second value.
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

/**
 * Checks whether the two specified values are NOT equivalent.
 *
 * @public
 * @param value1 - First value.
 * @param value2 - Second value.
 */
export function notEqual(value1: any, value2: any): boolean {
  return !equal(value1, value2);
}

/**
 * Generates a randomized id based on alphabetic and numeric characters.
 *
 * @public
 * @param length - Length of the to generate id (default = 5).
 * @param characters - Characters to generate the id from (default = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789').
 */
export function generateId(
  length = 5,
  characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
): string {
  const charactersLength = characters.length;
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

/**
 * Transforms the specified object into an array.
 *
 * Example:
 * {"1": 'jeff', 2: 'frank'} -> [{key: "1", instance: 'jeff'}, {key: 2, instance: 'frank'}]
 *
 * @public
 * @param object - Object to be transformed to an array.
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

/**
 * Clones the specified class.
 *
 * @public
 * @param instance - Class to be cloned.
 */
export function clone<T = any>(instance: T): T {
  // Clone Class
  const objectCopy: T = Object.create(Object.getPrototypeOf(instance));
  const objectClone = Object.assign(objectCopy, instance);

  // Copy Properties of Class to remove flat references
  for (const key in objectClone) objectClone[key] = copy(objectClone[key]);

  return objectClone;
}
