import {
  LogCodeManager as CoreLogCodeManager,
  assignAdditionalLogs,
} from '@agile-ts/core';

const additionalLogs = {
  // Validator
  '41:03:00': "A validation method needs to be of the type 'function'!",
  '41:03:01': "Appending a Validator to itself isn't allowed!",
};

/**
 * The Log Code Manager keeps track
 * and manages all important Logs for the '@agile-ts/multieditor' package.
 *
 * @internal
 */
export const LogCodeManager =
  process.env.NODE_ENV !== 'production'
    ? assignAdditionalLogs<
        typeof CoreLogCodeManager.logCodeMessages & typeof additionalLogs
      >(CoreLogCodeManager, additionalLogs)
    : assignAdditionalLogs<
        typeof CoreLogCodeManager.logCodeMessages & typeof additionalLogs
      >(CoreLogCodeManager, {});
