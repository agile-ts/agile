export function defineConfig(
  config: any,
  defaults: any,
  overwriteUndefinedProperties?: boolean
): any {
  if (overwriteUndefinedProperties === undefined)
    overwriteUndefinedProperties = true;

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
