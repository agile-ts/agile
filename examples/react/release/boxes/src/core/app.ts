import { Agile, assignSharedAgileInstance } from '@agile-ts/core';
import { assignSharedLogger, createLogger, Logger } from '@agile-ts/logger';

// Configure logging behaviour
assignSharedLogger(createLogger({ level: Logger.level.WARN }));

// Configure Agile Instance
export const App = new Agile({ key: 'boxes', bucket: true });
assignSharedAgileInstance(App);
