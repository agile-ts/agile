import { CreateLoggerConfigInterface, Logger } from './logger';
import { defineConfig } from '@agile-ts/utils';

const defaultLogConfig = {
  prefix: 'Agile',
  active: true,
  level: Logger.level.WARN,
  canUseCustomStyles: true,
  allowedTags: ['runtime', 'storage', 'subscription', 'multieditor'],
};

/**
 * Shared Agile Logger.
 */
let sharedAgileLogger = new Logger(defaultLogConfig);

/**
 * Assigns the specified configuration object to the shared Agile Logger.
 *
 * @param config - Configuration object
 */
// https://stackoverflow.com/questions/32558514/javascript-es6-export-const-vs-export-let
function assignSharedAgileLoggerConfig(
  config: CreateLoggerConfigInterface = {}
): Logger {
  config = defineConfig(config, defaultLogConfig);
  sharedAgileLogger = new Logger(config);
  return sharedAgileLogger;
}

export { sharedAgileLogger, assignSharedAgileLoggerConfig };
export * from './logger';
export default Logger;
