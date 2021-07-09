import { Agile, assignSharedAgileInstance } from '@agile-ts/core';
import { assignSharedAgileLoggerConfig, Logger } from '@agile-ts/logger';

export const App = new Agile();
assignSharedAgileInstance(App);
assignSharedAgileLoggerConfig({ level: Logger.level.WARN });
