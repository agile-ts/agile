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
} from '@agile-ts/core';
import { useIsomorphicLayoutEffect } from './useIsomorphicLayoutEffect';
import { DeepProxy } from '../DeepProxy';

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
  const proxyMap: ProxyMapInterface = {};

  // Creates Return Value of Hook, depending if deps are in Array shape or not
  const getReturnValue = (
    depsArray: (State | Observer | undefined)[]
  ): AgileHookArrayType<X> | AgileHookType<Y> => {
    if (depsArray.length === 1 && !Array.isArray(deps)) {
      const value = depsArray[0]?.value;
      const depKey = depsArray[0]?.key;

      if (isValidObject(value) && depKey) {
        return DeepProxy(
          value,
          {
            get(target, property) {
              console.log('Get Handler', target, property, this.path);
              // TODO deep tracking so if its a deep object and only a deep property got used than track this property and not just the top object property
              // Add property to proxyMap
              // proxyMap[depKey] = target[property];

              if (property in target) {
                if (isValidObject(target[property]))
                  return this.nest(target[property]);
                else target[property];
              }

              return undefined;
            },
          },
          {}
        ) as any;
      }

      return value;
    }

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

    console.log('ProxyMap:', proxyMap);
    // Create Callback based Subscription
    const subscriptionContainer = agileInstance.subController.subscribeWithSubsArray(
      () => {
        forceRender();
      },
      observers,
      {
        key,
        proxyKeyMap: {
          ['state-object']: { paths: [['friends', 'hans', 'name']] },
        },
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

interface ProxyMapInterface {
  [key: string]: { paths: string[][] };
}
