import {
  AgileHookConfigInterface,
  SubscribableAgileInstancesType,
  useAgile,
} from './useAgile';
import { SelectorMethodType, defineConfig } from '@agile-ts/core';
import { AgileValueHookType } from './useValue';

export function useSelector<
  ReturnType,
  X extends SubscribableAgileInstancesType,
  ValueType extends AgileValueHookType<X>
>(
  deps: X,
  selector: SelectorMethodType<ValueType>,
  config?: AgileHookConfigInterface
): ReturnType;

export function useSelector<ValueType = any, ReturnType = any>(
  deps: SubscribableAgileInstancesType,
  selector: SelectorMethodType<ValueType>,
  config?: AgileHookConfigInterface
): ReturnType;

export function useSelector<
  X extends SubscribableAgileInstancesType,
  ValueType extends AgileValueHookType<X>,
  ReturnType = any
>(
  deps: X,
  selector: SelectorMethodType<ValueType>,
  config: AgileHookConfigInterface = {}
): ReturnType {
  return useAgile(
    deps as any,
    defineConfig(config, {
      selector: selector,
    })
  ) as any;
}
