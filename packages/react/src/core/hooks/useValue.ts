import {
  Collection,
  Group,
  State,
  defineConfig,
  ItemKey,
} from '@agile-ts/core';
import { useAgile } from './useAgile';
import {
  BaseAgileHookConfigInterface,
  SubscribableAgileInstancesType,
} from './useBaseAgile';

export function useValue<X extends Array<SubscribableAgileInstancesType>>(
  deps: X | [],
  config?: BaseAgileHookConfigInterface
): AgileValueHookArrayType<X>;

export function useValue<X extends SubscribableAgileInstancesType>(
  dep: X,
  config?: BaseAgileHookConfigInterface
): AgileValueHookType<X>;

export function useValue<
  X extends Array<SubscribableAgileInstancesType>,
  Y extends SubscribableAgileInstancesType
>(
  deps: X | Y,
  config: BaseAgileHookConfigInterface = {}
): AgileValueHookArrayType<X> | AgileValueHookType<Y> {
  return useAgile(
    deps as any,
    defineConfig(config, {
      observerType: 'value',
    })
  ) as any;
}

// Array Type
// https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-1.html
export type AgileValueHookArrayType<T> = {
  [K in keyof T]: T[K] extends Collection | Group
    ? Array<ItemKey>
    : T[K] extends State<infer U>
    ? U
    : T[K] extends undefined
    ? undefined
    : T[K] extends Collection | Group | undefined
    ? Array<ItemKey> | undefined
    : T[K] extends State<infer U> | undefined
    ? U | undefined
    : never;
};

// No Array Type
export type AgileValueHookType<T> = T extends Collection | Group
  ? Array<ItemKey>
  : T extends State<infer U>
  ? U
  : T extends undefined
  ? undefined
  : T extends Collection | Group | undefined
  ? Array<ItemKey> | undefined
  : T extends State<infer U> | undefined
  ? U | undefined
  : never;
