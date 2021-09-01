import { CreateLoggerConfigInterface, Logger } from './logger';
import { defineConfig } from '@agile-ts/utils';

export * from './logger';
export default Logger;

const defaultLogConfig = {
  prefix: 'Agile',
  active: true,
  level: Logger.level.WARN,
  canUseCustomStyles: true,
  allowedTags: ['runtime', 'storage', 'subscription', 'multieditor'],
};

let sharedAgileLogger = new Logger(defaultLogConfig);

/**
 * Assigns the specified configuration object to the shared Agile Logger.
 *
 * @param config - Configuration object
 */
export function assignSharedAgileLoggerConfig(
  config: CreateLoggerConfigInterface = {}
): Logger {
  config = defineConfig(config, defaultLogConfig);
  sharedAgileLogger = new Logger(config);
  return sharedAgileLogger;
}

/**
 * Returns the shared Agile Logger.
 */
export function getLogger(): Logger {
  return sharedAgileLogger;
}
