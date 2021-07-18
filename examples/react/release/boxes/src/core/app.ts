import { Agile, assignSharedAgileInstance } from '@agile-ts/core';
import { assignSharedAgileLoggerConfig, Logger } from '@agile-ts/logger';

assignSharedAgileLoggerConfig({ level: Logger.level.WARN });
export const App = new Agile();
assignSharedAgileInstance(App);
