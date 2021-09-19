import { createCollection, globalBind } from '@agile-ts/core';
import { assignSharedLogger, createLogger, Logger } from '@agile-ts/logger';

assignSharedLogger(createLogger({ level: Logger.level.DEBUG }));

// Create Collection
export const TODOS = createCollection({
  initialData: [{ id: 1, name: 'Clean Bathroom' }],
}).persist('todos'); // persist does store the Collection in the Local Storage

globalBind('__core__', { TODOS });
