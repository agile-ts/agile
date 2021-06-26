import {
  AgileHookConfigInterface,
  SubscribableAgileInstancesType,
  useAgile,
} from './useAgile';
import { AgileOutputHookArrayType, AgileOutputHookType } from './useOutput';

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
  return useAgile(deps as any, { ...config, ...{ proxyBased: true } });
}
