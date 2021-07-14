import {
  Collection,
  Group,
  Observer,
  State,
  defineConfig,
} from '@agile-ts/core';
import {
  AgileHookConfigInterface,
  SubscribableAgileInstancesType,
  useAgile,
} from './useAgile';

export function useValue<X extends Array<SubscribableAgileInstancesType>>(
  deps: X | [],
  config?: AgileHookConfigInterface
): AgileValueHookArrayType<X>;

export function useValue<X extends SubscribableAgileInstancesType>(
  dep: X,
  config?: AgileHookConfigInterface
): AgileValueHookType<X>;

export function useValue<
  X extends Array<SubscribableAgileInstancesType>,
  Y extends SubscribableAgileInstancesType
>(
  deps: X | Y,
  config: AgileHookConfigInterface = {}
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
  [K in keyof T]: T[K] extends
    | Collection<infer U, infer Z>
    | Group<infer U, infer Z>
    ? Z
    : T[K] extends State<infer U> | Observer<infer U>
    ? U
    : T[K] extends undefined
    ? undefined
    : T[K] extends
        | Collection<infer U, infer Z>
        | Group<infer U, infer Z>
        | undefined
    ? Z | undefined
    : T[K] extends State<infer U> | Observer<infer U> | undefined
    ? U | undefined
    : never;
};

// No Array Type
export type AgileValueHookType<T> = T extends
  | Collection<infer U, infer Z>
  | Group<infer U, infer Z>
  ? Z
  : T extends State<infer U> | Observer<infer U>
  ? U
  : T extends undefined
  ? undefined
  : T extends Collection<infer U, infer Z> | Group<infer U, infer Z> | undefined
  ? Z | undefined
  : T extends State<infer U> | Observer<infer U> | undefined
  ? U | undefined
  : never;
