import {
  Agile,
  Observer,
  Collection,
  normalizeArray,
  isFunction,
  LogCodeManager,
} from './internal';

/**
 * Extracts an Instance of Agile from the specified Instance.
 * When no valid Agile Instance was found,
 * it returns the global bound Agile Instance or `undefined`.
 *
 * @internal
 * @param instance - Instance to extract the Agile Instance from.
 */
export function getAgileInstance(instance: any): Agile | undefined {
  try {
    // Try to get Agile Instance from specified Instance
    if (instance) {
      const _agileInstance = isFunction(instance['agileInstance'])
        ? instance['agileInstance']()
        : instance['agileInstance'];
      if (_agileInstance) return _agileInstance;
    }

    // Return global bound Agile Instance
    return globalThis[Agile.globalKey];
  } catch (e) {
    LogCodeManager.log('20:03:00', [], instance);
  }

  return undefined;
}

/**
 * Extracts the Observers from the specified Instances.
 *
 * @internal
 * @param instances - Instances to extract the Observers from.
 */
export function extractObservers(instances: any): Array<Observer | undefined> {
  const instancesArray: Array<Observer | undefined> = [];
  const tempInstancesArray = normalizeArray(instances, {
    createUndefinedArray: true,
  });

  // Get Observers from Instances
  for (const instance of tempInstancesArray) {
    // If the Instance equals to 'undefined'
    // (We have to add 'undefined' to the return value
    // in order to properly build the return value of,
    // for example, the 'useAgile()' hook later)
    if (instance == null) {
      instancesArray.push(undefined);
      continue;
    }

    // If the Instance equals to a Collection
    if (instance instanceof Collection) {
      instancesArray.push(
        instance.getGroupWithReference(instance.config.defaultGroupKey).observer
      );
      continue;
    }

    // If the Instance contains a property that is an Observer
    if (instance['observer'] && instance['observer'] instanceof Observer) {
      instancesArray.push(instance['observer']);
      continue;
    }

    // If the Instance equals to an Observer
    if (instance instanceof Observer) {
      instancesArray.push(instance);
      continue;
    }

    // Push 'undefined' if no valid Observer was found
    // (We have to add 'undefined' to the return value
    // in order to properly build the return value of,
    // for example, the 'useAgile()' hook later)
    instancesArray.push(undefined);
  }

  return instancesArray;
}

/**
 * Binds the specified Instance globally at the provided key identifier.
 *
 * Learn more about global bound instances:
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/globalThis
 * https://blog.logrocket.com/what-is-globalthis-why-use-it/
 *
 * @public
 * @param key - Key/Name identifier of the specified Instance.
 * @param instance - Instance to be bound globally.
 * @param overwrite - When already an Instance exists globally at the specified key,
 * whether to overwrite it with the new Instance.
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
    LogCodeManager.log('20:03:01', [key]);
  }
  return false;
}
