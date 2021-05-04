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
  isValidObject,
  ProxyKeyMapInterface,
} from '@agile-ts/core';
import { useIsomorphicLayoutEffect } from './useIsomorphicLayoutEffect';
import { ProxyTree } from '@agile-ts/proxytree';

//=========================================================================================================
// useAgile
//=========================================================================================================
/**
 * React Hook that binds Agile Instances like Collections, States, Computeds, .. to a React Functional Component
 * @param deps - Agile Instances that will be subscribed to this Component
 * @param key - Key/Name of SubscriptionContainer that gets created
 * @param agileInstance - An instance of Agile
 */
export function useProxy<X extends Array<SubscribableAgileInstancesType>>(
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
export function useProxy<X extends SubscribableAgileInstancesType>(
  dep: X,
  key?: SubscriptionContainerKeyType,
  agileInstance?: Agile
): AgileHookType<X>;

export function useProxy<
  X extends Array<SubscribableAgileInstancesType>,
  Y extends SubscribableAgileInstancesType
>(
  deps: X | Y,
  key?: SubscriptionContainerKeyType,
  agileInstance?: Agile
): AgileHookArrayType<X> | AgileHookType<Y> {
  console.log('useProxy');
  const depsArray = extractObservers(deps);
  const proxyTreeMap: ProxyTreeMapInterface = {};

  // Creates Return Value of Hook, depending if deps are in Array shape or not
  const getReturnValue = (
    depsArray: (State | Observer | undefined)[]
  ): AgileHookArrayType<X> | AgileHookType<Y> => {
    const handleReturn = (
      dep: State | Observer | undefined
    ): AgileHookType<Y> => {
      const value = dep?.value;
      const depKey = dep?.key;

      // If value is object wrap proxytree around it to track used properties
      if (isValidObject(value) && depKey) {
        const proxyTree = new ProxyTree(value);
        proxyTreeMap[depKey] = proxyTree;
        return proxyTree.proxy;
      }

      return dep?.value;
    };

    // Handle single dep
    if (depsArray.length === 1 && !Array.isArray(deps)) {
      return handleReturn(depsArray[0]);
    }

    // Handle dep array
    return depsArray.map((dep) => {
      return handleReturn(dep);
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

    // Build Proxy Key Map
    const proxyMap: ProxyKeyMapInterface = {};
    for (const proxyTreeKey in proxyTreeMap) {
      const proxyTree = proxyTreeMap[proxyTreeKey];
      proxyMap[proxyTreeKey] = {
        paths: proxyTree.transformTreeToArray() as any,
      };
    }

    // Create Callback based Subscription
    const subscriptionContainer = agileInstance.subController.subscribeWithSubsArray(
      () => {
        forceRender();
      },
      observers,
      {
        key,
        proxyKeyMap: proxyMap,
      }
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
  [K in keyof T]: T[K] extends Collection<infer U> | Group<infer U>
    ? U[]
    : T[K] extends State<infer U> | Observer<infer U>
    ? U
    : T[K] extends undefined
    ? undefined
    : T[K] extends Collection<infer U> | Group<infer U> | undefined
    ? U[] | undefined
    : T[K] extends State<infer U> | Observer<infer U> | undefined
    ? U | undefined
    : never;
};

// No Array Type
type AgileHookType<T> = T extends Collection<infer U> | Group<infer U>
  ? U[]
  : T extends State<infer U> | Observer<infer U>
  ? U
  : T extends undefined
  ? undefined
  : T extends Collection<infer U> | Group<infer U> | undefined
  ? U[] | undefined
  : T extends State<infer U> | Observer<infer U> | undefined
  ? U | undefined
  : never;

type SubscribableAgileInstancesType =
  | State
  | Collection<any> //https://stackoverflow.com/questions/66987727/type-classa-id-number-name-string-is-not-assignable-to-type-classar
  | Observer
  | undefined;

interface ProxyTreeMapInterface {
  [key: string]: ProxyTree;
}
