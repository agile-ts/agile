import {
  LogCodeManager as CoreLogCodeManager,
  assignAdditionalLogs,
} from '@agile-ts/core';

const additionalLogs = {
  '30:03:00':
    'Failed to subscribe Component with deps because of missing valid Agile Instance.',
  '31:03:00':
    "In order to use the Agile proxy functionality, the installation of an additional package called '@agile-ts/proxytree' is required!",
  '32:03:00': 'Failed to subscribe Component with deps',
};

/**
 * The Log Code Manager keeps track
 * and manages all important Logs for the '@agile-ts/react' package.
 *
 * @internal
 */
export const LogCodeManager =
  typeof process === 'object' && process.env.NODE_ENV !== 'production'
    ? assignAdditionalLogs<
        typeof CoreLogCodeManager.logCodeMessages & typeof additionalLogs
      >(additionalLogs, CoreLogCodeManager)
    : assignAdditionalLogs<
        typeof CoreLogCodeManager.logCodeMessages & typeof additionalLogs
      >({}, CoreLogCodeManager);
