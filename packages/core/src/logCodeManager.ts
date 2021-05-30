import { Agile } from './agile';

// 00:00:00
// |00|:00:00 first digits are based on the Agile Class
// 00 = General
// 10 = Agile
// 11 = Storage
// ..
// 00:|00|:00 second digits are based on the Log Type
const logCodeTypes = {
  '00': 'success',
  '01': 'info',
  '02': 'warn',
  '03': 'error',
};
// 00:00:|00| third digits are based on the Log Message (ascending counted)

const logCodeMessages = {
  // Agile
  '10:00:00': 'Created new AgileInstance.',
  '10:02:00':
    'Be careful when binding multiple Agile Instances globally in one application!',

  // Storages
  '11:02:00':
    "The 'Local Storage' is not available in your current environment." +
    "To use the '.persist()' functionality, please provide a custom Storage!",
  '11:02:01':
    'The first allocated Storage for AgileTs must be set as the default Storage!',
  '11:03:00': "Storage with the key/name '${0}' already exists!",
  '11:03:01':
    "Couldn't find Storage '${0}'. " +
    "The Storage with the key/name '${0}' doesn't exists!",
  '11:03:02': "Storage with the key/name '${0}' isn't ready yet!",
  '11:03:03':
    'No Storage found to get a value from! Please specify at least one Storage.',
  '11:03:04':
    'No Storage found to store a value in! Please specify at least one Storage.',
  '11:03:05':
    'No Storage found to remove a value from! Please specify at least one Storage.',

  // Persistent
  '12:03:00':
    'No valid persist Key found! Provide a valid key or assign one to the parent instance.',
  '12:03:01':
    'No persist Storage Key found! Please specify at least one Storage Key.',
  '12:03:02':
    "Couldn't validate Persistent '${0}'." +
    "The Storage with the key/name '${1}' doesn't exists!`",

  // Storage
  '13:01:00': "GET value at key '${1}' from Storage '${0}'.",
  '13:01:01': "SET value at key '${1}' in Storage '${0}'.",
  '13:01:02': "REMOVE value at key '${1}' from Storage '${0}'.",
  '13:02:00':
    'Using normalGet() in a async-based Storage might result in an unexpected return value. ' +
    'Instead of a resolved value a Promise is returned!',
  '13:03:00': "Invalid Storage '${0}()' method provided!",

  // State
  '14:02:00': "Incorrect type '${0}' was provided! Requires type of ${1}.",
  '14:03:00': "Incorrect type '${0}' was provided! Requires type of ${1}.",
  '14:03:01':
    "'${1}' is a not supported type! Supported types are: String, Boolean, Array, Object, Number.",
  '14:03:02': "The 'patch()' method works only in object based States!",
  '14:03:03': "Watcher Callback with the key/name '${0}' already exists!",
  '14:03:04': 'Only one Interval can be active at once!',
  '14:03:05': "The 'invert()' method works only in boolean based States!",

  // SubController
  '15:01:00': "Unregistered 'Callback' based Subscription.",
  '15:01:01': "Unregistered 'Component' based Subscription.",
  '15:01:02': "Registered 'Component' based Subscription.",
  '15:01:03': "Registered 'Callback' based Subscription.",

  // Runtime
  '16:01:00': "Created Job '${0}'",
  '16:01:01': "Completed Job '${0}'",
  '16:01:02': 'Updated/Rerendered Subscriptions',
  '16:02:00': "SubscriptionContainer/Component '${0}' isn't ready to rerender!",
  '16:02:01':
    'Job with not ready SubscriptionContainer/Component was removed from the runtime ' +
    'after ${0} tries to avoid a Job overflow.',

  // Observer
  '17:03:00':
    "The 'perform()' method isn't set in Observer but need to be set! Observer is no stand alone class.",

  // Integrations
  '18:00:00': "Integrated '${0}' into AgileTs",
  '18:02:00':
    "Can't call the 'update()' method on a not ready Integration '${0}'!",
  '18:03:00': "Failed to integrate Framework '${0}'!",

  // Computed
  '19:03:00':
    "The 'patch()' method can't be used in the Computed Class! " +
    "The Computed Class has a dynamic value which shouldn't be changed manually.",
  '19:03:01':
    "The 'persist()' method can't be used in the Computed Class! " +
    "The Computed Class has a dynamic value which shouldn't be persisted. " +
    'Consider persisting the values the Computed depends on.',
  '19:03:02':
    "The 'invert()' method can't be used in the Computed Class! " +
    "The Computed Class has a dynamic value which shouldn't be changed manually.",

  // Collection Persistent
  '1A:02:00': 'Failed to build unique Item StorageKey!',
  '1A:02:01': 'Failed to build unique Group StorageKey!',

  // Collection
  '1B:02:00':
    "We recommend using 'createGroup()' " +
    "instead of 'Group()' outside the Collection configuration object.",
  '1B:02:01':
    "We recommend using 'createSelector()' " +
    "instead of 'Selector()' outside the Collection configuration object.",
  '1B:02:02':
    'By overwriting the whole Item ' +
    "you have to pass the correct itemKey into the 'changes object!'",
  '1B:02:03':
    "We recommend using 'Group()' instead of 'createGroup()' " +
    'inside the Collection configuration object.',
  '1B:02:04':
    "We recommend using 'Selector()' instead of 'createSelector()' " +
    'inside the Collection configuration object.',
  '1B:02:05':
    "Collection '${0}' Item Data has to contain a primaryKey property called '${1}'!",
  '1B:03:00':
    "Couldn't update Item with the key/name '${0}' " +
    "because it doesn't exist in Collection '${1}'",
  '1B:03:01':
    "Valid object required to update Item value '${0}' in Collection '${1}'!",
  '1B:03:02': "Group with the key/name '${0}' already exists!",
  '1B:03:03': "Selector with the key/name '${0}' already exists!",
  '1B:03:04':
    "Couldn't update ItemKey from '${0}' to '${1}' " +
    "because an Item with the key/name '${1}' already exists in the Collection '${2}'!",
  '1B:03:05': "Item Data of Collection '${0}' has to be a valid object!",
  '1B:03:06':
    "Item tried to add to the Collection '${0}' belongs to another Collection '${1}'!",

  // Group
  '1C:02:00':
    "Couldn't find some Items in the Collection '${0}' " +
    "during the rebuild of the Group '${1}' output.",

  // Utils
  '20:03:00': 'Failed to get Agile Instance from',
  '20:03:01': "Failed to create global Instance at '${0}'",

  // General
  '00:03:00':
    "The '${0}()' method isn't set in ${1} but need to be set!" +
    ' ${1} is no stand alone class.',
  '00:03:01': "'${0}' has to be of the type ${1}!",
};

//=========================================================================================================
// Get Log
//=========================================================================================================
/**
 * @internal
 * Returns the log message according to the passed logCode
 * @param logCode - Log Code of Message
 * @param replacers - Instances that replace these '${x}' placeholders based on the index
 * For example: replacers[0] replaces '${0}', replacers[1] replaces '${1}', ...
 */
function getLog<T extends LogCodesArrayType<typeof logCodeMessages>>(
  logCode: T,
  replacers: any[] = []
): string {
  let result = logCodeMessages[logCode] ?? `'${logCode}' is a unknown logCode!`;

  for (const i in replacers) {
    // https://stackoverflow.com/questions/41438656/why-do-i-get-cannot-read-property-tostring-of-undefined
    result = result.split('${' + i + '}').join(replacers[i] + '');
  }

  return result;
}

//=========================================================================================================
// Log
//=========================================================================================================
/**
 * @internal
 * Logs message at the provided logCode with the Agile.logger
 * @param logCode - Log Code of Message
 * @param replacers - Instances that replace these '${x}' placeholders based on the index
 * For example: replacers[0] replaces '${0}', replacers[1] replaces '${1}', ..
 * @param data - Data attached to the end of the log message
 */
function log<T extends LogCodesArrayType<typeof logCodeMessages>>(
  logCode: T,
  replacers: any[] = [],
  ...data: any[]
): void {
  const codes = logCode.split(':');
  if (codes.length === 3)
    Agile.logger[logCodeTypes[codes[1]]](getLog(logCode, replacers), ...data);
}

/**
 * @internal
 * Manages logCode based logging of AgileTs
 */
export const LogCodeManager = {
  getLog,
  log,
  logCodeLogTypes: logCodeTypes,
  logCodeMessages: logCodeMessages,
};

export type LogCodesArrayType<T> = {
  [K in keyof T]: T[K] extends string ? K : never;
}[keyof T] &
  string;
