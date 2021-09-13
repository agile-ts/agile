export function cloneDeep<T = any>(value: T): T {
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
    newObject[property] = cloneDeep(temp);
  }
  return newObject as T;
}
