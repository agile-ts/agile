import { defineConfig } from '@agile-ts/utils';
import { runsOnServer } from '../utils';
import { CreateAgileSubInstanceInterface, shared } from '../shared';
import { CreateStoragesConfigInterface, Storages } from './storages';

/**
 * Handles the permanent persistence of Agile Classes.
 */
let sharedStorageManager: Storages | null = null;
export { sharedStorageManager };

/**
 * Assigns the specified Storage Manager
 * as default (shared) Storage Manager for all Agile Instances.
 *
 *  @param instance - Storage Manager to be assigned as the shared Storage Manager.
 */
// https://stackoverflow.com/questions/32558514/javascript-es6-export-const-vs-export-let
export const assignSharedStorageManager = (instance: Storages | null) => {
  sharedStorageManager = instance;
};

/**
 * Returns a newly created Storage Manager.
 *
 * A Storage Manager manages all external Storages for AgileTs
 * and provides an interface to easily store,
 * load and remove values from multiple external Storages at once.
 *
 * @param config - Configuration object
 */
export function createStorageManager(
  config: CreateStorageManagerConfigInterfaceWithAgile = {}
): Storages {
  config = defineConfig(config, {
    agileInstance: shared,
  });
  return new Storages(config.agileInstance as any, config);
}

/**
 * Returns the shared Storage Manager
 * or creates a new one when no shared Storage Manager exists.
 */
export function getSharedStorageManager(): Storages {
  if (sharedStorageManager == null) {
    const newStorageManager = createStorageManager({
      localStorage: !runsOnServer(),
    });
    assignSharedStorageManager(newStorageManager);
    return newStorageManager;
  }
  return sharedStorageManager;
}

export interface CreateStorageManagerConfigInterfaceWithAgile
  extends CreateAgileSubInstanceInterface,
    CreateStoragesConfigInterface {}
