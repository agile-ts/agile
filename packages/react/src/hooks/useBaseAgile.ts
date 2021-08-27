import React from 'react';
import Agile, {
  Collection,
  ComponentIdType,
  getAgileInstance,
  LogCodeManager,
  Observer,
  State,
  SubscriptionContainerKeyType,
  RegisterSubscriptionConfigInterface,
} from '@agile-ts/core';
import { useIsomorphicLayoutEffect } from './useIsomorphicLayoutEffect';

export const useBaseAgile = (
  depsArray: (Observer | undefined)[],
  getSubContainerConfig: (
    observers: Observer[]
  ) => RegisterSubscriptionConfigInterface,
  deps: any[],
  agileInstance?: Agile
) => {
  // Trigger State, used to force Component to rerender
  const [, forceRender] = React.useReducer((s) => s + 1, 0);

  useIsomorphicLayoutEffect(() => {
    // https://github.com/microsoft/TypeScript/issues/20812
    const observers = depsArray.filter(
      (dep): dep is Observer => dep !== undefined
    );

    const subContainerConfig = getSubContainerConfig(observers);

    const _agileInstance = extractAgileInstance(observers, agileInstance);
    if (_agileInstance == null) return;

    // Create Callback based Subscription
    const subscriptionContainer = _agileInstance.subController.subscribe(
      () => {
        forceRender();
      },
      observers,
      subContainerConfig
    );

    // Unsubscribe Callback based Subscription on unmount
    return () => {
      _agileInstance.subController.unsubscribe(subscriptionContainer);
    };
  }, deps);
};

export const extractAgileInstance = (
  observers: Observer[],
  agileInstance?: Agile
): Agile | undefined => {
  if (agileInstance != null) return agileInstance;

  // Try to extract Agile Instance from the specified Observers
  agileInstance = getAgileInstance(observers[0]);
  if (!agileInstance || !agileInstance.subController) {
    LogCodeManager.getLogger()?.error(
      'Failed to subscribe to React Component because of missing valid Agile Instance.',
      observers
    );
    return undefined;
  }
  return agileInstance;
};

// Builds return value,
// depending on whether the deps were provided in array shape or not
export const getReturnValue = (
  depsArray: (Observer | undefined)[],
  handleReturn: (dep: Observer | undefined) => any,
  wasProvidedAsArray: boolean
): any => {
  // Handle single dep return value
  if (depsArray.length === 1 && !wasProvidedAsArray) {
    return handleReturn(depsArray[0]);
  }

  // Handle deps array return value
  return depsArray.map((dep) => {
    return handleReturn(dep);
  });
};

export type SubscribableAgileInstancesType =
  | State
  | Collection<any, any> //https://stackoverflow.com/questions/66987727/type-classa-id-number-name-string-is-not-assignable-to-type-classar
  | Observer
  | undefined;

export interface BaseAgileHookConfigInterface {
  /**
   * Key/Name identifier of the Subscription Container to be created.
   * @default undefined
   */
  key?: SubscriptionContainerKeyType;
  /**
   * Instance of Agile the Subscription Container belongs to.
   * @default `undefined` if no Agile Instance could be extracted from the provided Instances.
   */
  agileInstance?: Agile;
  /**
   * Key/Name identifier of the UI-Component the Subscription Container is bound to.
   * @default undefined
   */
  componentId?: ComponentIdType;
  /**
   * Dependencies that determine, in addition to unmounting and remounting the React-Component,
   * when the specified Agile Sub Instances should be re-subscribed to the React-Component.
   *
   * [Github issue](https://github.com/agile-ts/agile/issues/170)
   *
   * @default []
   */
  deps?: any[];
}
