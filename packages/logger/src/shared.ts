import { defineConfig } from '@agile-ts/utils';
import { Logger, LoggerConfig } from './logger';

export const defaultSharedLoggerConfig = {
  prefix: 'Agile',
  active: true,
  level: Logger.level.WARN,
  canUseCustomStyles: true,
  allowedTags: ['runtime', 'storage', 'subscription', 'multieditor'],
};

let sharedLogger = new Logger(defaultSharedLoggerConfig);
export { sharedLogger };

/**
 * Assigns the specified configuration object to the shared Agile Logger.
 *
 * @param logger - Configuration object
 */
export function assignSharedLogger(logger: Logger): void {
  sharedLogger = logger;
}

/**
 * Returns a newly created Logger.
 *
 * @param config - Configuration object
 */
export function createLogger(config: LoggerConfig = {}): Logger {
  config = defineConfig(config, defaultSharedLoggerConfig);
  return new Logger(config);
}
