export function defineConfig(
  config: any,
  defaults: any,
  overwriteUndefinedProperties?: boolean
): any {
  if (overwriteUndefinedProperties === undefined)
    overwriteUndefinedProperties = true;

  if (overwriteUndefinedProperties) {
    const finalConfig = { ...defaults, ...config };
    for (const key in finalConfig)
      if (finalConfig[key] === undefined) finalConfig[key] = defaults[key];
    return finalConfig;
  }

  return { ...defaults, ...config };
}
