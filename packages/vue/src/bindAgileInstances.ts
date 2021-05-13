import Vue from 'vue';
import { Agile, Collection, Observer, State } from '@agile-ts/core';
import { isValidObject, normalizeArray } from '@agile-ts/utils';

export function bindAgileInstances(
  deps: DepsType,
  agile: Agile,
  vueComponent: Vue
) {
  let depsWithoutIndicator: Set<Observer> = new Set();
  let depsWithIndicator: DepsWithIndicatorType;

  // Format Deps
  if (isValidObject(deps)) {
    depsWithIndicator = formatDepsWithIndicator(deps as any);
  } else {
    const response = formatDepsWithNoSafeIndicator(deps as any);
    depsWithIndicator = response.depsWithIndicator;
    depsWithoutIndicator = response.depsWithoutIndicator;
  }

  // Create Subscription with Observer that have no Indicator and can't passed into this.state (Rerender will be caused via force Update)
  if (depsWithoutIndicator.size > 0) {
    agile.subController.subscribeWithSubsArray(
      vueComponent,
      Array.from(depsWithoutIndicator)
    );
  }

  // Create Subscription with Observer that have an Indicator (Rerender will be cause via mutating this.state)
  if (depsWithIndicator) {
    return agile.subController.subscribeWithSubsObject(
      vueComponent,
      depsWithIndicator
    ).props;
  }

  return {};
}

//=========================================================================================================
// Format Deps With No Safe Indicator
//=========================================================================================================
/**
 * @private
 * Formats Deps that have no safe indicator and gets Observers from them.
 * It tries to use the existing Key of the Dep as Indicator.
 * @param deps - Deps that have no safe Indicator and get formatted
 */
const formatDepsWithNoSafeIndicator = (
  deps: Array<SubscribableAgileInstancesType> | SubscribableAgileInstancesType
): RegisterDepsWithNoSafeIndicatorResponseInterface => {
  const depsWithIndicator: DepsWithIndicatorType = {};
  const depsWithoutIndicator: Set<Observer> = new Set();
  const depsArray = normalizeArray(deps as any, {
    createUndefinedArray: true,
  });

  // Get Observers from Deps
  for (const dep of depsArray) {
    if (!dep) continue;

    // If Dep is Collection
    if (dep instanceof Collection) {
      depsWithoutIndicator.add(
        dep.getGroupWithReference(dep.config.defaultGroupKey).observer
      );
      continue;
    }

    // If Dep has property that is Observer
    if (dep['observer']) {
      depsWithoutIndicator.add(dep['observer']);
      continue;
    }

    // If Dep is Observer
    if (dep instanceof Observer) {
      depsWithoutIndicator.add(dep);
    }
  }

  // Add deps with key to depsWithIndicator and remove them from depsWithoutIndicator
  for (const dep of depsWithoutIndicator) {
    if (dep && dep['key']) {
      depsWithIndicator[dep['key']] = dep;
      depsWithoutIndicator.delete(dep);
    }
  }

  return {
    depsWithIndicator,
    depsWithoutIndicator,
  };
};

//=========================================================================================================
// Format Deps With Indicator
//=========================================================================================================
/**
 * @private
 * Format Deps that have an Indicator and gets Observers from them.
 * The key of a property in the object is the indicator.
 * @param deps - Deps that have an Indicator and get formatted
 */
const formatDepsWithIndicator = (deps: {
  [key: string]: SubscribableAgileInstancesType;
}): DepsWithIndicatorType => {
  const depsWithIndicator: DepsWithIndicatorType = {};

  // Get Observers from Deps
  for (const depKey in deps) {
    const dep = deps[depKey];
    if (!dep) continue; // undefined deps won't be represented in props anyway

    // If Dep is Collection
    if (dep instanceof Collection) {
      depsWithIndicator[depKey] = dep.getGroupWithReference(
        dep.config.defaultGroupKey
      ).observer;
      continue;
    }

    // If Dep has property that is an Observer
    if (dep['observer']) {
      depsWithIndicator[depKey] = dep['observer'];
      continue;
    }

    // If Dep is Observer
    if (dep instanceof Observer) {
      depsWithIndicator[depKey] = dep;
    }
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
  | { [key: string]: SubscribableAgileInstancesType }
  | SubscribableAgileInstancesType;

type DepsWithIndicatorType = { [key: string]: Observer };

interface RegisterDepsWithNoSafeIndicatorResponseInterface {
  depsWithoutIndicator: Set<Observer>;
  depsWithIndicator: DepsWithIndicatorType;
}
