import React from 'react';
import Agile, {
  Collection,
  ComponentIdType,
  getAgileInstance,
  Observer,
  State,
  SubscriptionContainerKeyType,
  RegisterSubscriptionConfigInterface,
} from '@agile-ts/core';
import { useIsomorphicLayoutEffect } from './useIsomorphicLayoutEffect';
import { LogCodeManager } from '../logCodeManager';

/**
 * An internal used React Hook
 * to create a Callback based Subscription Container
 * based on the specified depsArray
 * and thus bind these dependencies to a Functional React Component.
 *
 * @internal
 * @param depsArray - Observers to be bound to the Functional Component.
 * @param getSubContainerConfig - Method to get the Subscription Container configuration object.
 * @param deps - Dependencies that determine, in addition to unmounting and remounting the React-Component,
 * when the specified Agile Sub Instances should be re-subscribed to the React-Component.
 * @param agileInstance - Agile Instance the to create Subscription Container belongs to.
 */
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

    // Try to extract Agile Instance from the specified Instance/s
    if (agileInstance == null) agileInstance = getAgileInstance(observers[0]);
    if (agileInstance == null || agileInstance.subController == null) {
      LogCodeManager.log('30:03:00', deps);
      return;
    }

    // Create Callback based Subscription
    const subscriptionContainer = agileInstance.subController.subscribe(
      () => {
        forceRender();
      },
      observers,
      subContainerConfig
    );

    // Unsubscribe Callback based Subscription on unmount
    return () => {
      agileInstance?.subController.unsubscribe(subscriptionContainer);
    };
  }, deps);
};

/**
 * Builds return value for Agile Instance 'binding' Hooks,
 * depending on whether the dependencies were provided in array shape or not.
 *
 * @internal
 * @param depsArray - Dependencies to extract the return value from.
 * @param handleReturn - Method to handle the return value.
 * @param wasProvidedAsArray - Whether the specified depsArray was provided as array in the Hook.
 */
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
