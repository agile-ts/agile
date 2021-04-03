import React from 'react';
import {
  Agile,
  Collection,
  getAgileInstance,
  Group,
  extractObservers,
  Observer,
  State,
  SubscriptionContainerKeyType,
} from '@agile-ts/core';
import { useIsomorphicLayoutEffect } from './useIsomorphicLayoutEffect';

//=========================================================================================================
// useAgile
//=========================================================================================================
/**
 * React Hook that binds Agile Instances like Collections, States, Computeds, .. to a React Functional Component
 * @param deps - Agile Instances that will be subscribed to this Component
 * @param key - Key/Name of SubscriptionContainer that gets created
 * @param agileInstance - An instance of Agile
 */
export function useAgile<X extends Array<SubscribableAgileInstancesType>>(
  deps: X | [],
  key?: SubscriptionContainerKeyType,
  agileInstance?: Agile
): AgileHookArrayType<X>;

/**
 * React Hook that binds Agile Instance like Collection, State, Computed, .. to a React Functional Component
 * @param dep - Agile Instance that will be subscribed to this Component
 * @param key - Key/Name of SubscriptionContainer that gets created
 * @param agileInstance - An instance of Agile
 */
export function useAgile<X extends SubscribableAgileInstancesType>(
  dep: X,
  key?: SubscriptionContainerKeyType,
  agileInstance?: Agile
): AgileHookType<X>;

export function useAgile<
  X extends Array<SubscribableAgileInstancesType>,
  Y extends SubscribableAgileInstancesType
>(
  deps: X | Y,
  key?: SubscriptionContainerKeyType,
  agileInstance?: Agile
): AgileHookArrayType<X> | AgileHookType<Y> {
  const depsArray = extractObservers(deps);

  // Creates Return Value of Hook, depending if deps are in Array shape or not
  const getReturnValue = (
    depsArray: (State | Observer | undefined)[]
  ): AgileHookArrayType<X> | AgileHookType<Y> => {
    if (depsArray.length === 1 && !Array.isArray(deps))
      return depsArray[0]?.value;

    return depsArray.map((dep) => {
      return dep?.value;
    }) as AgileHookArrayType<X>;
  };

  // Trigger State used to force Component to rerender
  const [, forceRender] = React.useReducer((s) => s + 1, 0);

  useIsomorphicLayoutEffect(() => {
    // Try to get Agile Instance
    if (!agileInstance) agileInstance = getAgileInstance(depsArray[0]);
    if (!agileInstance || !agileInstance.subController) {
      Agile.logger.error('Failed to subscribe Component with deps', deps);
      return;
    }

    // https://github.com/microsoft/TypeScript/issues/20812
    const observers: Observer[] = depsArray.filter(
      (dep): dep is Observer => dep !== undefined
    );

    // Create Callback based Subscription
    const subscriptionContainer = agileInstance.subController.subscribeWithSubsArray(
      () => {
        forceRender();
      },
      observers,
      key
    );

    // Unsubscribe Callback based Subscription on Unmount
    return () => {
      agileInstance?.subController.unsubscribe(subscriptionContainer);
    };
  }, []);

  return getReturnValue(depsArray);
}

// Array Type
// https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-1.html
type AgileHookArrayType<T> = {
  [K in keyof T]: T[K] extends Group<infer U>
    ? U[]
    : T[K] extends State<infer U>
    ? U
    : T[K] extends Observer<infer U>
    ? U
    : T[K] extends Collection<infer U>
    ? U[]
    : T[K] extends undefined
    ? undefined
    : T[K] extends Group<infer U> | undefined
    ? U[] | undefined
    : T[K] extends State<infer U> | undefined
    ? U | undefined
    : T[K] extends Observer<infer U> | undefined
    ? U | undefined
    : T[K] extends Collection<infer U> | undefined
    ? U[] | undefined
    : never;
};

// No Array Type
type AgileHookType<T> = T extends Group<infer U>
  ? U[]
  : T extends State<infer U>
  ? U
  : T extends Observer<infer U>
  ? U
  : T extends Collection<infer U>
  ? U[]
  : T extends undefined
  ? undefined
  : T extends Group<infer U> | undefined
  ? U[] | undefined
  : T extends State<infer U> | undefined
  ? U | undefined
  : T extends Observer<infer U> | undefined
  ? U | undefined
  : T extends Collection<infer U> | undefined
  ? U[] | undefined
  : never;

type SubscribableAgileInstancesType = State | Collection | Observer | undefined;
