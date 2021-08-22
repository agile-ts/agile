import {
  CreateStorageConfigInterface,
  Storage,
  Storages,
  shared,
  CreateStoragesConfigInterface,
  CreateAgileSubInstanceInterface,
  defineConfig,
  removeProperties,
  LogCodeManager,
} from '../internal';

export * from './storages';
// export * from './storage';
// export * from './persistent';

// Handles the permanent persistence of Agile Classes
let storageManager: Storages | null = null;

/**
 * Returns a newly created Storage.
 *
 * A Storage Class serves as an interface to external storages,
 * such as the [Async Storage](https://github.com/react-native-async-storage/async-storage) or
 * [Local Storage](https://www.w3schools.com/html/html5_webstorage.asp).
 *
 * It creates the foundation to easily [`persist()`](https://agile-ts.org/docs/core/state/methods#persist) [Agile Sub Instances](https://agile-ts.org/docs/introduction/#agile-sub-instance)
 * (like States or Collections) in nearly any external storage.
 *
 * [Learn more..](https://agile-ts.org/docs/core/agile-instance/methods#createstorage)
 *
 * @public
 * @param config - Configuration object
 */
export function createStorage(config: CreateStorageConfigInterface): Storage {
  return new Storage(config);
}

/**
 * Returns a newly created Storage Manager.
 *
 * A Storage Manager manages all external Storages for an AgileTs
 * and provides an interface to easily store,
 * load and remove values from multiple Storages at once.
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
 * Returns the current registered Storage Manager.
 */
export function getStorageManager(): Storages | null {
  return storageManager;
}

/**
 * Registers the specified Storage Manager
 * as default Storage Manager for all Agile Instances.
 *
 *  @param instance - Storage Manager to be registered as the default Storage Manager.
 */
export const registerStorageManager = (instance: Storages) => {
  if (storageManager != null) {
    LogCodeManager.log('11:02:06', [], storageManager);
  }
  storageManager = instance;
};

export interface CreateStorageManagerConfigInterfaceWithAgile
  extends CreateAgileSubInstanceInterface,
    CreateStoragesConfigInterface {}
