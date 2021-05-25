// 00:00:00
// first digits is based on the AgileClass
// 00 = Agile
// 01 = Storage
// ..
// second digits is based on the log type
// 00 = Success
// 01 = Info
// 02 = Warning
// 03 = Error
// third digits is based on the log message

export const logCodes = {
  // Agile
  '00:00:00': 'Created new AgileInstance. [logCode: 00:00:00]',
  '00:02:00':
    'Be careful when binding multiple Agile Instances globally in one application! [logCode: 00:01:00]',

  // Storage
  '01:02:00':
    "The 'Local Storage' is not available in your current environment." +
    "To use the '.persist()' functionality, please provide a custom Storage!",
  '01:02:01':
    'The first allocated Storage for AgileTs must be set as the default Storage!',
  '01:03:00': "Storage with the key/name '${0}' already exists!",
};

type LogCodesArrayType<T> = {
  [K in keyof T]: T[K] extends string ? K : never;
}[keyof T] &
  string;

export function replace<T extends LogCodesArrayType<typeof logCodes>>(
  logCode: T,
  replacers: any[]
): string {
  let result = logCodes[logCode] ?? 'unknown';
  for (const i in replacers)
    result = result.replace('${' + i + '}', replacers[i]);
  return result;
}
