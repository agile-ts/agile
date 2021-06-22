import {
  AgileHookConfigInterface,
  SubscribableAgileInstancesType,
  useAgile,
} from './useAgile';
import { SelectorMethodType } from '@agile-ts/core';

export function useSelector<
  SelectedType extends any,
  X extends Array<SubscribableAgileInstancesType>
>(
  deps: X | [],
  selector: SelectorMethodType<SelectedType>,
  config?: AgileHookConfigInterface
): Array<SelectedType>;

export function useSelector<
  SelectedType extends any,
  X extends SubscribableAgileInstancesType
>(
  dep: X,
  selector: SelectorMethodType<SelectedType>,
  config?: AgileHookConfigInterface
): SelectedType;

export function useSelector<
  SelectedType extends any,
  X extends Array<SubscribableAgileInstancesType>,
  Y extends SubscribableAgileInstancesType
>(
  deps: X | Y,
  selector: SelectorMethodType<SelectedType>,
  config: AgileHookConfigInterface = {}
): Array<SelectedType> | SelectedType {
  return useAgile(deps as any, { ...config, ...{ selector: selector } }) as any;
}
