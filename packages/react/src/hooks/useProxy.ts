import { Agile, SubscriptionContainerKeyType } from '@agile-ts/core';
import {
  AgileHookArrayType,
  AgileHookType,
  SubscribableAgileInstancesType,
  useAgile,
} from './useAgile';

//=========================================================================================================
// useProxy
//=========================================================================================================
/**
 * React Hook that binds Agile Instances like Collections, States, Computeds, .. to a React Functional Component
 * @param deps - Agile Instances that will be subscribed to this Component
 * @param config - Config
 */
export function useProxy<X extends Array<SubscribableAgileInstancesType>>(
  deps: X | [],
  config?: ProxyHookConfigInterface
): AgileHookArrayType<X>;

/**
 * React Hook that binds Agile Instance like Collection, State, Computed, .. to a React Functional Component
 * @param dep - Agile Instance that will be subscribed to this Component
 * @param config - Config
 */
export function useProxy<X extends SubscribableAgileInstancesType>(
  dep: X,
  config?: ProxyHookConfigInterface
): AgileHookType<X>;

export function useProxy<
  X extends Array<SubscribableAgileInstancesType>,
  Y extends SubscribableAgileInstancesType
>(
  deps: X | Y,
  config: ProxyHookConfigInterface = {}
): AgileHookArrayType<X> | AgileHookType<Y> {
  return useAgile(deps as any, { ...config, ...{ proxyBased: true } }) as any;
}

/**
 * @param key - Key/Name of SubscriptionContainer that gets created
 * @param agileInstance - An instance of Agile
 */
interface ProxyHookConfigInterface {
  key?: SubscriptionContainerKeyType;
  agileInstance?: Agile;
}
