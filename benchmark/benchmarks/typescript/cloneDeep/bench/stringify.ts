export function cloneDeep<T = any>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}
