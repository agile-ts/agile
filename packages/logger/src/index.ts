import { CreateLoggerConfigInterface, Logger } from './logger';
import { defineConfig } from '@agile-ts/utils';

export * from './logger';
export default Logger;

/**
 * Shared Agile Logger.
 */
export let sharedAgileLogger = new Logger();
assignSharedAgileLoggerConfig();

/**
 * Assigns the specified configuration object to the shared Agile Logger.
 *
 * @param config - Configuration object
 */
// https://stackoverflow.com/questions/32558514/javascript-es6-export-const-vs-export-let
export function assignSharedAgileLoggerConfig(
  config: CreateLoggerConfigInterface = {}
): void {
  config = defineConfig(config, {
    prefix: 'Agile',
    active: true,
    level: Logger.level.SUCCESS,
    canUseCustomStyles: true,
    allowedTags: ['runtime', 'storage', 'subscription', 'multieditor'],
  });
  sharedAgileLogger = new Logger(config);
}
