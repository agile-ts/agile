import Vue from 'vue';
import {
  Agile,
  extractRelevantObservers,
  Observer,
  State,
} from '@agile-ts/core';
import { isValidObject, normalizeArray } from '@agile-ts/utils';
import type { Collection } from '@agile-ts/core'; // Only import Collection and Group type for better Treeshaking

export function bindAgileInstances(
  deps: DepsType,
  agile: Agile,
  vueComponent: Vue,
  observerType?: string
): { [key: string]: any } {
  let depsWithoutIndicator: Array<Observer> = [];
  let depsWithIndicator: DepsWithIndicatorType;

  // Format deps
  if (isValidObject(deps)) {
    depsWithIndicator = formatDepsWithIndicator(deps as any, observerType);
  } else {
    const response = formatDepsWithNoSafeIndicator(deps as any, observerType);
    depsWithIndicator = response.depsWithIndicator;
    depsWithoutIndicator = response.depsWithoutIndicator;
  }

  // Create Subscription with extracted Observers
  // that have no unique key/name indicator
  // and thus can't be merged into the 'sharedState' property.
  // (Re-render will be enforced via a force update)
  if (depsWithoutIndicator.length > 0) {
    agile.subController.subscribe(vueComponent, depsWithoutIndicator, {
      waitForMount: false,
    });
  }

  // Create Subscription with extracted Observers
  // that have a unique key/name indicator.
  // (Rerender will be enforced via mutating the 'this.$data.sharedState' property)
  if (depsWithIndicator) {
    return agile.subController.subscribe(vueComponent, depsWithIndicator, {
      waitForMount: false,
    }).props;
  }

  return {};
}

/**
 * Extracts the Observers from the specified dependencies
 * which probably have no safe unique indicator key/name.
 *
 * If a unique key/name indicator could be found
 * the extracted Observer is added to the `depsWithIndicator` object
 * and otherwise to the `depsWithoutIndicator` array.
 *
 * What type of Observer is extracted from a dependency,
 * depends on the specified `observerType`.
 * If no `observerType` is specified, the Observers found in the dependency
 * are selected in the following `observerType` order.
 * 1. `output`
 * 2. `value`
 *
 * @internal
 * @param deps - Dependencies in array shape to extract the Observers from.
 * @param observerType - Type of Observer to be extracted.
 */
const formatDepsWithNoSafeIndicator = (
  deps: Array<SubscribableAgileInstancesType> | SubscribableAgileInstancesType,
  observerType?: string
): {
  depsWithoutIndicator: Observer[];
  depsWithIndicator: DepsWithIndicatorType;
} => {
  const depsArray = extractRelevantObservers(
    normalizeArray(deps),
    observerType
  );
  const depsWithIndicator: DepsWithIndicatorType = {};
  let depsWithoutIndicator: Observer[] = depsArray.filter(
    (dep): dep is Observer => dep !== undefined
  );

  // Try to extract a unique key/name identifiers from the extracted Observers
  depsWithoutIndicator = depsWithoutIndicator.filter((dep) => {
    if (dep && dep['key'] != null) {
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
 * which have a unique key/name identifier
 * through the object property key.
 *
 * What type of Observer is extracted from a dependency,
 * depends on the specified `observerType`.
 * If no `observerType` is specified, the Observers found in the dependency
 * are selected in the following `observerType` order.
 * 1. `output`
 * 2. `value`
 *
 * @internal
 * @param deps - Dependencies in object shape to extract the Observers from.
 * @param observerType - Type of Observer to be extracted.
 */
const formatDepsWithIndicator = (
  deps: {
    [key: string]: SubscribableAgileInstancesType;
  },
  observerType?: string
): DepsWithIndicatorType => {
  const depsObject = extractRelevantObservers(deps, observerType);
  const depsWithIndicator: DepsWithIndicatorType = {};
  for (const key in depsObject) {
    const observer = depsObject[key];
    if (observer != null) depsWithIndicator[key] = observer;
  }
  return depsWithIndicator;
};

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
