import {
  AgileHookConfigInterface,
  SubscribableAgileInstancesType,
  useAgile,
} from './useAgile';
import { AgileOutputHookArrayType, AgileOutputHookType } from './useOutput';
import { defineConfig } from '@agile-ts/core';

export function useProxy<X extends Array<SubscribableAgileInstancesType>>(
  deps: X | [],
  config?: AgileHookConfigInterface
): AgileOutputHookArrayType<X>;

export function useProxy<X extends SubscribableAgileInstancesType>(
  dep: X,
  config?: AgileHookConfigInterface
): AgileOutputHookType<X>;

export function useProxy<
  X extends Array<SubscribableAgileInstancesType>,
  Y extends SubscribableAgileInstancesType
>(
  deps: X | Y,
  config: AgileHookConfigInterface = {}
): AgileOutputHookArrayType<X> | AgileOutputHookType<Y> {
  return useAgile(
    deps as any,
    defineConfig(config, {
      proxyBased: true,
    })
  );
}
