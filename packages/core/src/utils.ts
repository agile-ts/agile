import { isFunction, normalizeArray } from '@agile-ts/utils';
import { Agile } from './agile';
import { shared } from './shared';
import { LogCodeManager } from './logCodeManager';
import { Observer } from './runtime/observer';

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

    // Try to get shared Agile Instance
    if (shared instanceof Agile) {
      return shared;
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
 * ```
 * const response = extractObservers([myState, myGroup, undefined]);
 * console.log(response); // See below
 * {
 *   {value: Observer},
 *   {value: Observer, output: Observer},
 *   {}
 * }
 * ```
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
 * ```
 * const response = extractObservers(myState);
 * console.log(response); // See below
 * {
 *  value: Observer
 * }
 * ```
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
  const observers: Array<{ [key: string]: Observer | undefined }> = [];
  const tempInstancesArray = normalizeArray(instances, {
    createUndefinedArray: true,
  });

  // Extract Observers from specified Instances
  for (const instance of tempInstancesArray) {
    // If the Instance equals to 'null' or 'undefined'
    if (instance == null) {
      observers.push({});
      continue;
    }

    // TODO this use of the Collection avoid tree shaking it
    // If the Instance equals to a Collection
    // if (instance instanceof Collection) {
    //   observers.push(
    //     instance.getGroupWithReference(instance.config.defaultGroupKey)
    //       .observers as any
    //   );
    //   continue;
    // }

    // If the Instance contains a property that is an Observer
    if (instance['observer'] && instance['observer'] instanceof Observer) {
      observers.push({ value: instance['observer'] });
      continue;
    }

    // If the Instance contains a property that contains multiple Observers
    if (instance['observers']) {
      const extractedObservers = {};
      for (const key in instance['observers']) {
        if (instance['observers'][key] instanceof Observer) {
          extractedObservers[key] = instance['observers'][key];
        }
      }
      observers.push(extractedObservers);
      continue;
    }

    // If the Instance equals to an Observer
    if (instance instanceof Observer) {
      observers.push({ value: instance });
      continue;
    }

    // Push empty object if no valid Observer was found
    observers.push({});
  }

  return Array.isArray(instances) ? observers : observers[0];
}

/**
 * Extracts the most relevant Observers
 * from the specified Instance/s in array shape
 * and returns the extracted Observers in the given order.
 *
 * What type of Observer is extracted from an Instance,
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
): Array<Observer | undefined>;
/**
 * Extracts the most relevant Observers
 * from the specified Instance/s in object shape
 * and returns the extracted Observers in the given order.
 *
 * What type of Observer is extracted from an Instance,
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
): { [key: string]: Observer | undefined };

export function extractRelevantObservers<
  X extends { [key: string]: any },
  Y extends Array<any>
>(
  instances: X | Y,
  observerType?: string
): Array<Observer | undefined> | { [key: string]: Observer | undefined } {
  const depsWithIndicator: { [key: string]: Observer | undefined } = {};
  const depsWithNoIndicator: Array<Observer | undefined> = [];

  // Extract Observers from deps
  for (const depKey in instances) {
    const extractedObservers = extractObservers(instances[depKey]);
    let observer: Observer | undefined = undefined;

    // Extract Observer at specified type
    if (observerType != null && extractedObservers[observerType] != null)
      observer = extractedObservers[observerType];

    // Extract most relevant Observer
    if (observerType == null)
      observer = extractedObservers['output'] ?? extractedObservers['value'];

    if (Array.isArray(instances)) depsWithNoIndicator.push(observer);
    else depsWithIndicator[depKey] = observer;
  }

  return Array.isArray(instances) ? depsWithNoIndicator : depsWithIndicator;
}

/**
 * Retrieves the module with the specified key/name identifier
 * and returns `null` if the module couldn't be found.
 *
 * @param moduleName - Key/Name identifier of the module to be retrieved.
 * @param error - Whether to print an error, when the module couldn't be retrieved.
 */
export function optionalRequire<PackageType = any>(
  moduleName: string,
  error = true
): PackageType | null {
  let requiredPackage = null;
  try {
    requiredPackage = require(moduleName);
  } catch (e) {
    if (error) {
      LogCodeManager.log('20:03:02', [moduleName]);
      console.log(e);
    }
  }
  return requiredPackage;
}

/**
 * Binds the specified Instance globally at the provided key identifier.
 *
 * Learn more about global bound instances:
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/globalThis
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

/**
 * Returns a boolean indicating whether AgileTs is currently running on a server.
 *
 * @public
 */
export const runsOnServer = (): boolean => {
  return !(
    typeof window !== 'undefined' &&
    typeof window.document !== 'undefined' &&
    typeof window.document.createElement !== 'undefined'
  );
};
