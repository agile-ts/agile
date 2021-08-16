import { CreateStorageConfigInterface, Storage } from '../internal';
import type { Storages } from '../internal';

export * from './storages';
// export * from './storage';
// export * from './persistent';

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

// Handles the permanent persistence of Agile Classes
export let storageManager: Storages | null = null;

export const registerStorageManager = (instance: Storages) => {
  if (storageManager != null) {
    // TODO print warning
  }
  storageManager = instance;
};
