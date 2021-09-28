import { copy } from '@agile-ts/utils';

/**
 * Updates a nested property at the specified path with the provided new value.
 *
 * Inspired by:
 * https://stackoverflow.com/questions/18936915/dynamically-set-property-of-nested-object
 *
 * @param obj - Object in which the property is to be updated at the path.
 * @param path - Path to the property to be updated in the specified object.
 * @param value - New value
 */
export function updateNestedProperty(
  obj: Object,
  path: string | string[],
  value: any
) {
  const updatedObject = copy(obj);

  let schema = updatedObject; // A moving reference to internal objects within 'newObject'
  const pathParts = Array.isArray(path) ? path : path.split('.');
  const pathPartsLength = pathParts.length;

  if (pathPartsLength <= 0) return obj;

  // Go to the corresponding object part where the value should be updated
  for (let i = 0; i < pathPartsLength - 1; i++) {
    const pathPart = pathParts[i];
    if (!schema[pathPart]) schema[pathPart] = {};
    schema = schema[pathPart];
  }

  // Update the value in the schema (corresponding object part)
  // and thus automatically update the 'newObject' by reference
  schema[pathParts[pathPartsLength - 1]] = value;

  return updatedObject;
}
