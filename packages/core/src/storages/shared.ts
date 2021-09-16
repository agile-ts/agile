import { CreateStoragesConfigInterface, Storages } from './storages';
import { defineConfig, removeProperties } from '@agile-ts/utils';
import { CreateAgileSubInstanceInterface, shared } from '../shared';
import { runsOnServer } from '../utils';
import { LogCodeManager } from '../logCodeManager';

// Handles the permanent persistence of Agile Classes
let storageManager: Storages | null = null;

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
  return new Storages(
    config.agileInstance as any,
    removeProperties(config, ['agileInstance'])
  );
}

/**
 * Returns the shared Storage Manager
 * or creates a new one when no shared Storage Manager exists.
 */
export function getStorageManager(): Storages {
  if (storageManager == null) {
    const newStorageManager = createStorageManager({
      localStorage: !runsOnServer(),
    });
    assignSharedAgileStorageManager(newStorageManager);
    return newStorageManager;
  }
  return storageManager;
}

/**
 * Assigns the specified Storage Manager
 * as default (shared) Storage Manager for all Agile Instances.
 *
 *  @param instance - Storage Manager to be registered as the default Storage Manager.
 */
export const assignSharedAgileStorageManager = (instance: Storages | null) => {
  if (storageManager != null) {
    LogCodeManager.log('11:02:06', [], storageManager);
  }
  storageManager = instance;
};

export interface CreateStorageManagerConfigInterfaceWithAgile
  extends CreateAgileSubInstanceInterface,
    CreateStoragesConfigInterface {}
