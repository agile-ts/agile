import Vue from 'vue';
import {
  Agile,
  Collection,
  extractObservers,
  Observer,
  State,
} from '@agile-ts/core';
import { isValidObject } from '@agile-ts/utils';

export function bindAgileInstances(
  deps: DepsType,
  agile: Agile,
  vueComponent: Vue,
  observerType = 'value'
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

//=========================================================================================================
// Format Deps With No Safe Indicator
//=========================================================================================================
/**
 * @internal
 * Extract Observers from dependencies which might not have an indicator.
 * If a indicator could be found it will be added to 'depsWithIndicator' otherwise to 'depsWithoutIndicator'.
 * @param deps - Dependencies to be formatted
 * @param observerType - Type of Observer to be extracted.
 */
const formatDepsWithNoSafeIndicator = (
  deps: Array<SubscribableAgileInstancesType> | SubscribableAgileInstancesType,
  observerType = 'value'
): {
  depsWithoutIndicator: Observer[];
  depsWithIndicator: DepsWithIndicatorType;
} => {
  const depsArray = extractObservers(deps);
  const depsWithIndicator: DepsWithIndicatorType = {};
  let depsWithoutIndicator: Observer[] = depsArray
    .map((dep) => dep[observerType])
    .filter((dep): dep is Observer => dep !== undefined);

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

//=========================================================================================================
// Format Deps With Indicator
//=========================================================================================================
/**
 * @internal
 * Extract Observers from dependencies which have an indicator through the object property key.
 * @param deps - Dependencies to be formatted
 * @param observerType - Type of Observer to be extracted.
 */
const formatDepsWithIndicator = (
  deps: {
    [key: string]: SubscribableAgileInstancesType;
  },
  observerType = 'value'
): DepsWithIndicatorType => {
  const depsWithIndicator: DepsWithIndicatorType = {};

  // Extract Observers from Deps
  for (const depKey in deps) {
    const observer = extractObservers(deps[depKey])[0][observerType];
    if (observer != null) depsWithIndicator[depKey] = observer;
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
