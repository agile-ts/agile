import Vue from 'vue';
import {
  Agile,
  Collection,
  extractObservers,
  Observer,
  State,
} from '@agile-ts/core';
import { isValidObject, normalizeArray } from '@agile-ts/utils';

export function bindAgileInstances(
  deps: DepsType,
  agile: Agile,
  vueComponent: Vue,
  observerType?: string
): { [key: string]: any } {
  let depsWithoutIndicator: Array<Observer> = [];
  let depsWithIndicator: DepsWithIndicatorType;

  // Format Deps
  if (isValidObject(deps)) {
    depsWithIndicator = formatDepsWithIndicator(deps as any, observerType);
  } else {
    const response = formatDepsWithNoSafeIndicator(deps as any, observerType);
    depsWithIndicator = response.depsWithIndicator;
    depsWithoutIndicator = response.depsWithoutIndicator;
  }

  // Create Subscription with Observer that have no Indicator and can't be merged into the 'sharedState' (Rerender will be caused via force Update)
  if (depsWithoutIndicator.length > 0) {
    agile.subController.subscribe(vueComponent, depsWithoutIndicator, {
      waitForMount: false,
    });
  }

  // Create Subscription with Observer that have an Indicator (Rerender will be cause via mutating 'this.$data.sharedState')
  if (depsWithIndicator) {
    return agile.subController.subscribe(vueComponent, depsWithIndicator, {
      waitForMount: false,
    }).props;
  }

  return {};
}

/**
 * Extracts the Observers from the specified dependencies
 * which have no safe unique indicator key.
 *
 * If an indicator could be found
 * it is added to the `depsWithIndicator` object otherwise to the `depsWithoutIndicator` array.
 *
 * What type of Observer is extracted from a dependency
 * depends on the specified `observerType`.
 * If no `observerType` is specified, the Observers found in the dependency
 * are selected in the following `observerType` order.
 * - 1. `output`
 * - 2. `value`
 *
 * @internal
 * @param deps - Dependencies to extract the Observers from
 * @param observerType - Type of Observer to be extracted.
 */
const formatDepsWithNoSafeIndicator = (
  deps: Array<SubscribableAgileInstancesType> | SubscribableAgileInstancesType,
  observerType?: string
): {
  depsWithoutIndicator: Observer[];
  depsWithIndicator: DepsWithIndicatorType;
} => {
  const depsWithIndicator: DepsWithIndicatorType = {};
  let depsWithoutIndicator = extractObserverFromDeps(
    normalizeArray(deps),
    observerType
  );

  // Add deps with key to 'depsWithIndicator' and remove them from 'depsWithoutIndicator'
  depsWithoutIndicator = depsWithoutIndicator.filter((dep) => {
    if (dep && dep['key']) {
      depsWithIndicator[dep['key']] = dep;
      return false;
    }
    return true;
  });

  return {
    depsWithIndicator,
    depsWithoutIndicator,
  };
};

/**
 * Extracts the Observers from the specified dependencies
 * which have a unique indicator key through the object property key.
 *
 * What type of Observer is extracted from a dependency
 * depends on the specified `observerType`.
 * If no `observerType` is specified, the Observers found in the dependency
 * are selected in the following `observerType` order.
 * - 1. `output`
 * - 2. `value`
 *
 * @internal
 * @param deps - Dependencies to extract the Observers from
 * @param observerType - Type of Observer to be extracted.
 */
const formatDepsWithIndicator = (
  deps: {
    [key: string]: SubscribableAgileInstancesType;
  },
  observerType?: string
): DepsWithIndicatorType => {
  return extractObserverFromDeps(deps, observerType);
};

/**
 * Extracts the Observers from the specified dependencies
 * provided in array shape.
 *
 * What type of Observer is extracted from a dependency
 * depends on the specified `observerType`.
 * If no `observerType` is specified, the Observers found in the dependency
 * are selected in the following `observerType` order.
 * - 1. `output`
 * - 2. `value`
 *
 * @internal
 * @param deps - Dependencies in array shape  to extract the Observers from.
 * @param observerType - Type of Observer to be extracted.
 */
function extractObserverFromDeps<
  X extends Array<SubscribableAgileInstancesType>
>(deps: X, observerType?: string): Array<Observer>;
/**
 * Extracts the Observers from the specified dependencies
 * provided in object shape.
 *
 * What type of Observer is extracted from a dependency
 * depends on the specified `observerType`.
 * If no `observerType` is specified, the Observers found in the dependency
 * are selected in the following `observerType` order.
 * - 1. `output`
 * - 2. `value`
 *
 * @internal
 * @param deps - Dependencies in object shape to extract the Observers from.
 * @param observerType - Type of Observer to be extracted.
 */
function extractObserverFromDeps<
  X extends { [key: string]: SubscribableAgileInstancesType }
>(deps: X, observerType?: string): DepsWithIndicatorType;

function extractObserverFromDeps<
  X extends { [key: string]: SubscribableAgileInstancesType },
  Y extends Array<SubscribableAgileInstancesType>
>(deps: X | Y, observerType?: string): Array<Observer> | DepsWithIndicatorType {
  const depsWithIndicator: DepsWithIndicatorType = {};
  const depsWithNoIndicator: Array<Observer> = [];

  // Extract Observers from Deps
  for (const depKey in deps) {
    const extractedObservers = extractObservers(deps[depKey])[0];
    let observer: Observer | undefined = undefined;

    // Extract Observer at specified type from the fround Observers
    if (observerType != null && extractedObservers[observerType])
      observer = extractedObservers[observerType];
    else {
      observer = extractedObservers['output'] ?? extractedObservers['value'];
    }

    if (observer != null) {
      if (Array.isArray(deps)) depsWithNoIndicator.push(observer);
      else depsWithIndicator[depKey] = observer;
    }
  }

  return Array.isArray(deps) ? depsWithNoIndicator : depsWithIndicator;
}

type SubscribableAgileInstancesType =
  | State
  | Collection<any> //https://stackoverflow.com/questions/66987727/type-classa-id-number-name-string-is-not-assignable-to-type-classar
  | Observer
  | undefined;

export type DepsType =
  | Array<SubscribableAgileInstancesType>
  | { [key: string]: SubscribableAgileInstancesType };
//  | SubscribableAgileInstancesType; // Not allowed because each passed Agile Instance is detect as object and will run through 'formatDepsWithIndicator'

type DepsWithIndicatorType = { [key: string]: Observer };
