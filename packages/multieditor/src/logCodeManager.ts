import {
  logCodeManager as coreLogCodeManager,
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
export const logCodeManager = assignAdditionalLogs<
  typeof coreLogCodeManager.logCodeMessages & typeof additionalLogs,
  typeof coreLogCodeManager.logCodeMessages
>(
  coreLogCodeManager,
  process.env.NODE_ENV !== 'production' ? additionalLogs : {}
);
