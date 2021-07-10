export function defineConfig(
  config: any,
  defaults: any,
  overwriteUndefinedProperties?: boolean
): void {
  if (overwriteUndefinedProperties === undefined)
    overwriteUndefinedProperties = true;

  for (const defaultKey in defaults) {
    if (
      !Object.prototype.hasOwnProperty.call(config, defaultKey) ||
      (overwriteUndefinedProperties && config[defaultKey] === undefined)
    )
      config[defaultKey] = defaults[defaultKey];
  }
}
