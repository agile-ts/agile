import {
  Agile,
  Observer,
  Collection,
  normalizeArray,
  isFunction,
} from './internal';

//=========================================================================================================
// Get Agile Instance
//=========================================================================================================
/**
 * @internal
 * Tries to get an Instance of Agile from provided Instance
 * If no agileInstance found it returns the global bound Agile Instance
 * @param instance - Instance that might hold an Agile Instance
 */
export function getAgileInstance(instance: any): Agile | undefined {
  try {
    // Try to get agileInstance from passed Instance
    if (instance) {
      const _agileInstance = isFunction(instance['agileInstance'])
        ? instance['agileInstance']()
        : instance['agileInstance'];
      if (_agileInstance) return _agileInstance;
    }

    // Return global bound agileInstance
    return globalThis[Agile.globalKey];
  } catch (e) {
    Agile.logger.error('Failed to get Agile Instance from ', instance);
  }

  return undefined;
}

//=========================================================================================================
// Extract Observers
//=========================================================================================================
/**
 * @private
 * Extract Observers from specific Instances
 * @param instances - Instances that will be formatted
 */
export function extractObservers(instances: any): Array<Observer | undefined> {
  const instancesArray: Array<Observer | undefined> = [];
  const tempInstancesArray = normalizeArray(instances, {
    createUndefinedArray: true,
  });

  // Get Observers from Instances
  for (const instance of tempInstancesArray) {
    // If Instance is undefined (We have to add undefined to build a proper return value in for instance 'useAgile' later)
    if (!instance) {
      instancesArray.push(undefined);
      continue;
    }

    // If Instance is Collection
    if (instance instanceof Collection) {
      instancesArray.push(
        instance.getGroupWithReference(instance.config.defaultGroupKey).observer
      );
      continue;
    }

    // If Instance has property that is an Observer
    if (instance['observer'] && instance['observer'] instanceof Observer) {
      instancesArray.push(instance['observer']);
      continue;
    }

    // If Instance is Observer
    if (instance instanceof Observer) {
      instancesArray.push(instance);
      continue;
    }

    // Push undefined if no Observer could be found (We have to add undefined to build a proper return value in for instance 'useAgile' later)
    instancesArray.push(undefined);
  }

  return instancesArray;
}

//=========================================================================================================
// Global Bind
//=========================================================================================================
/**
 * @internal
 * Binds passed Instance globally at passed Key
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/globalThis
 * https://blog.logrocket.com/what-is-globalthis-why-use-it/
 * @param key - Key/Name of Instance
 * @param instance - Instance
 * @param overwrite - If already existing instance at passed Key gets overwritten
 */
export function globalBind(
  key: string,
  instance: any,
  overwrite = false
): boolean {
  try {
    if (overwrite) {
      globalThis[key] = instance;
      return true;
    }

    if (globalThis[key] == null) {
      globalThis[key] = instance;
      return true;
    }
  } catch (e) {
    Agile.logger.error(`Failed to create global Instance called '${key}'`);
  }
  return false;
}
