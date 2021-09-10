import { createCollection } from '@agile-ts/core';
import { assignSharedAgileLoggerConfig, Logger } from '@agile-ts/logger';

assignSharedAgileLoggerConfig({ level: Logger.level.DEBUG });

// Create Collection
export const TODOS = createCollection({
  initialData: [{ id: 1, name: 'Clean Bathroom' }],
}).persist('todos'); // persist does store the Collection in the Local Storage
