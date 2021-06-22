import {
  AgileHookConfigInterface,
  SubscribableAgileInstancesType,
  useAgile,
} from './useAgile';
import { SelectorMethodType } from '@agile-ts/core';
import { AgileValueHookType } from './useValue';

export function useSelector<
  X extends SubscribableAgileInstancesType,
  ValueType extends AgileValueHookType<X>
>(
  deps: X,
  selector: SelectorMethodType<ValueType>,
  config: AgileHookConfigInterface = {}
): any /* TODO Make this more typesafe!! */ {
  return useAgile(deps as any, { ...config, ...{ selector: selector } }) as any;
}
