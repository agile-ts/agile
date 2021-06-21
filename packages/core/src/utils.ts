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
 * Extracts all Observers from the specified Instances
 * and returns them in the given order.
 *
 * @internal
 * @param instances - Instances to extract the Observers from.
 */
export function extractObservers(
  instances: Array<any>
): Array<{ [key: string]: Observer | undefined }>;
/**
 * Extracts all Observers from the specified Instance.
 *
 * @internal
 * @param instances - Instance to extract the Observers from.
 */
export function extractObservers(
  instances: any
): { [key: string]: Observer | undefined };

export function extractObservers(
  instances: any | Array<any>
):
  | Array<{ [key: string]: Observer | undefined }>
  | { [key: string]: Observer | undefined } {
  const instancesArray: Array<{ [key: string]: Observer | undefined }> = [];
  const tempInstancesArray = normalizeArray(instances, {
    createUndefinedArray: true,
  });

  // Get Observers from Instances
  for (const instance of tempInstancesArray) {
    // If the Instance equals to 'undefined'
    if (instance == null) {
      instancesArray.push({});
      continue;
    }

    // If the Instance equals to a Collection
    if (instance instanceof Collection) {
      instancesArray.push(
        instance.getGroupWithReference(instance.config.defaultGroupKey)
          .observers as any
      );
      continue;
    }

    // If the Instance contains a property that is an Observer
    if (instance['observer'] && instance['observer'] instanceof Observer) {
      instancesArray.push({ value: instance['observer'] });
      continue;
    }

    // If the Instance contains a property that includes Observers
    if (instance['observers']) {
      const extractedObservers = {};
      for (const key in instance['observers']) {
        if (instance['observers'][key] instanceof Observer) {
          extractedObservers[key] = instance['observers'][key];
        }
      }
      instancesArray.push(extractedObservers);
      continue;
    }

    // If the Instance equals to an Observer
    if (instance instanceof Observer) {
      instancesArray.push({ value: instance });
      continue;
    }

    // Push empty object if no valid Observer was found
    instancesArray.push({});
  }

  return Array.isArray(instances) ? instancesArray : instancesArray[0];
}

/**
 * Extracts the most relevant Observers
 * from the specified Instance/s in array shape
 * and returns the extracted Observers in the given order.
 *
 * What type of Observer is extracted from an Instance
 * depends on the specified `observerType`.
 * If no `observerType` is specified, the Observers found in the dependency
 * are selected in the following `observerType` order.
 * 1. `output`
 * 2. `value`
 *
 * @internal
 * @param instances - Instances in array shape  to extract the Observers from.
 * @param observerType - Type of Observer to be extracted.
 */
export function extractRelevantObservers<X extends Array<any>>(
  instances: X,
  observerType?: string
): Array<Observer>;
/**
 * Extracts the most relevant Observers
 * from the specified Instance/s in object shape
 * and returns the extracted Observers in the given order.
 *
 * What type of Observer is extracted from an Instance
 * depends on the specified `observerType`.
 * If no `observerType` is specified, the Observers found in the dependency
 * are selected in the following `observerType` order.
 * 1. `output`
 * 2. `value`
 *
 * @internal
 * @param instances - Instances in object shape to extract the Observers from.
 * @param observerType - Type of Observer to be extracted.
 */
export function extractRelevantObservers<X extends { [key: string]: any }>(
  instances: X,
  observerType?: string
): { [key: string]: Observer };

export function extractRelevantObservers<
  X extends { [key: string]: any },
  Y extends Array<any>
>(
  instances: X | Y,
  observerType?: string
): Array<Observer> | { [key: string]: Observer } {
  const depsWithIndicator: { [key: string]: Observer } = {};
  const depsWithNoIndicator: Array<Observer> = [];

  // Extract Observers from deps
  for (const depKey in instances) {
    const extractedObservers = extractObservers(instances[depKey]);
    let observer: Observer | undefined = undefined;

    // Extract Observer at specified type from the fround Observers
    if (observerType != null && extractedObservers[observerType])
      observer = extractedObservers[observerType];
    else {
      observer = extractedObservers['output'] ?? extractedObservers['value'];
    }

    if (observer != null) {
      if (Array.isArray(instances)) depsWithNoIndicator.push(observer);
      else depsWithIndicator[depKey] = observer;
    }
  }

  return Array.isArray(instances) ? depsWithNoIndicator : depsWithIndicator;
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
