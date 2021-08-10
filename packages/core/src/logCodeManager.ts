import { isDev } from './utils';

// The Log Code Manager keeps track
// and manages all important Logs of AgileTs.
//
// How does the identification of Log Messages work?
// Let's take a look at this example:
// 00:00:00
//
// |00|:00:00 first digits are based on the Agile Class
// 00 = General
// 10 = Agile
// 11 = Storage
// ..
//
// ---
// 00:|00|:00 second digits are based on the Log Type
const logCodeTypes = {
  '00': 'success',
  '01': 'info',
  '02': 'warn',
  '03': 'error',
};
//
// ---
// 00:00:|00| third digits are based on the Log Message (ascending counted)

const niceLogCodeMessages = {
  // Agile
  '10:00:00': 'Created new AgileInstance.',
  '10:02:00':
    'Be careful when binding multiple Agile Instances globally in one application!',

  // Storages
  '11:02:00':
    "The 'Local Storage' is not available in your current environment. " +
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
    'No valid persist Storage Key found! Please specify at least one Storage Key to use the persist functionality.',
  '12:03:02':
    "Couldn't validate Persistent '${0}'." +
    "The Storage with the key/name '${1}' doesn't exists!`",

  // Storage
  '13:00:00': "Registered new Storage '${0}'.",
  '13:01:00': "GET value at key '${1}' from Storage '${0}'.",
  '13:01:01': "SET value at key '${1}' in Storage '${0}'.",
  '13:01:02': "REMOVE value at key '${1}' from Storage '${0}'.",
  '13:02:00':
    'Using normalGet() in a async-based Storage might result in an unexpected return value. ' +
    'Instead of a resolved value a Promise is returned!',
  '13:03:00': "Invalid Storage '${0}()' method provided!",

  // State
  '14:03:01':
    "'${1}' is a not supported type! Supported types are: String, Boolean, Array, Object, Number.",
  '14:03:02': "The 'patch()' method works only in object based States!",
  '14:03:03': 'Only one Interval can be active at once!',
  '14:03:04': "Failed to invert value of the type '${0}'!",

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
  '18:00:00': "Integrated '${0}' into AgileTs '${1}'",
  '18:02:00':
    "Can't call the 'update()' method on a not ready Integration '${0}'!",
  '18:03:00': "Failed to integrate Framework '${0}' into AgileTs '${1}'!",

  // Computed
  '19:03:00':
    "The 'persist()' method can't be used in the Computed Class! " +
    "The Computed Class has a dynamic value which shouldn't be persisted. " +
    'Consider persisting the values the Computed depends on.',

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
  '1C:03:00':
    "The 'output' property of the Group '${0}' is a automatically generated readonly property " +
    'that can only be mutated by the Group itself!',
  '1C:03:01':
    "The 'item' property of the Group '${0}' is a automatically generated readonly property " +
    'that can only be mutated by the Group itself!',

  // Utils
  '20:03:00': 'Failed to get Agile Instance from',
  '20:03:01': "Failed to create global Instance at '${0}'",
  '20:03:02': "Required module '${0}' couldn't be retrieved!",

  // General
  '00:03:00':
    "The '${0}()' method isn't set in ${1} but need to be set!" +
    ' ${1} is no stand alone class.',
  '00:03:01': "'${0}' has to be of the type ${1}!",
};

const logCodeMessages: typeof niceLogCodeMessages = isDev
  ? niceLogCodeMessages
  : ({} as any);

/**
 * Returns the log message according to the specified log code.
 *
 * @internal
 * @param logCode - Log code of the message to be returned.
 * @param replacers - Instances that replace these '${x}' placeholders based on the index
 * For example: 'replacers[0]' replaces '${0}', 'replacers[1]' replaces '${1}', ..
 */
function getLog<T extends LogCodesArrayType<typeof logCodeMessages>>(
  logCode: T,
  replacers: any[] = []
): string {
  let result = logCodeMessages[logCode];
  if (result == null) return logCode;

  // Replace '${x}' with the specified replacer instances
  for (let i = 0; i < replacers.length; i++) {
    result = result.replace('${' + i + '}', replacers[i]);
  }

  return result;
}

/**
 * Logs the log message according to the specified log code
 * with the Agile Logger if installed or the normal console.
 *
 * @internal
 * @param logCode - Log code of the message to be returned.
 * @param replacers - Instances that replace these '${x}' placeholders based on the index
 * For example: 'replacers[0]' replaces '${0}', 'replacers[1]' replaces '${1}', ..
 * @param data - Data to be attached to the end of the log message.
 */
function log<T extends LogCodesArrayType<typeof logCodeMessages>>(
  logCode: T,
  replacers: any[] = [],
  ...data: any[]
): void {
  const logger = LogCodeManager.getLogger();
  if (logger != null && !logger.isActive) return;
  const logType = logCodeTypes[logCode.substr(3, 2)];
  if (typeof logType !== 'string') return;

  // Handle logging without Logger
  if (logger == null) {
    if (logType === 'error' || logType === 'warn')
      console[logType](`Agile: ${getLog(logCode, replacers)}`);
    return;
  }

  // Handle logging with Logger
  logger[logType](getLog(logCode, replacers), ...data);
}

/**
 * Logs the log message according to the specified log code
 * with the Agile Logger if installed and the provided tags are active.
 *
 * @internal
 * @param tags - Tags to be active to log the logCode.
 * @param logCode - Log code of the message to be returned.
 * @param replacers - Instances that replace these '${x}' placeholders based on the index
 * For example: 'replacers[0]' replaces '${0}', 'replacers[1]' replaces '${1}', ..
 * @param data - Data to be attached to the end of the log message.
 */
function logIfTags<T extends LogCodesArrayType<typeof logCodeMessages>>(
  tags: string[],
  logCode: T,
  replacers: any[] = [],
  ...data: any[]
): void {
  const logger = LogCodeManager.getLogger();
  if (logger != null && !logger.isActive) return;
  const logType = logCodeTypes[logCode.substr(3, 2)];
  if (typeof logType !== 'string') return;

  // Handle logging without Logger
  if (logger == null) {
    // Log nothing since if a log has a tag it is probably not so important
    return;
  }

  // Handle logging with Logger
  logger.if.tag(tags)[logType](getLog(logCode, replacers), ...data);
}
/**
 * The Log Code Manager keeps track
 * and manages all important Logs of AgileTs.
 *
 * @internal
 */
let tempLogCodeManager;
if (isDev) {
  tempLogCodeManager = {
    getLog,
    log,
    logCodeLogTypes: logCodeTypes,
    logCodeMessages: logCodeMessages,
    // Not doing 'logger: loggerPackage?.sharedAgileLogger'
    // because only by calling a function (now 'getLogger()') the 'sharedLogger' is refetched
    getLogger: () => {
      let loggerPackage: any = null;
      try {
        loggerPackage = require('@agile-ts/logger');
      } catch (e) {
        // empty catch block
      }

      return loggerPackage?.sharedAgileLogger ?? null;
    },
    logIfTags,
  };
} else {
  tempLogCodeManager = {
    getLog: (logCode, replacers) => logCode,
    log,
    logCodeLogTypes: logCodeTypes,
    logCodeMessages: logCodeMessages,
    // Not doing 'logger: loggerPackage?.sharedAgileLogger'
    // because only by calling a function (now 'getLogger()') the 'sharedLogger' is refetched
    getLogger: () => {
      return null;
    },
    logIfTags: (tags, logCode, replacers) => log(logCode, replacers),
  };
}
export const LogCodeManager = tempLogCodeManager;

export type LogCodesArrayType<T> = {
  [K in keyof T]: T[K] extends string ? K : never;
}[keyof T] &
  string;
