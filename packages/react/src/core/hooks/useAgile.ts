import {
  Observer,
  State,
  generateId,
  extractRelevantObservers,
  normalizeArray,
  defineConfig,
} from '@agile-ts/core';
import type { Collection, Group } from '@agile-ts/core'; // Only import Collection and Group type for better Treeshaking
import {
  BaseAgileHookConfigInterface,
  getReturnValue,
  SubscribableAgileInstancesType,
  useBaseAgile,
} from './useBaseAgile';

/**
 * A React Hook for binding the most relevant value of multiple Agile Instances
 * (like the Collection's output or the State's value)
 * to a React Functional Component.
 *
 * This binding ensures that the Component re-renders
 * whenever the most relevant Observer of an Agile Instance mutates.
 *
 * @public
 * @param deps - Agile Sub Instances to be bound to the Functional Component.
 * @param config - Configuration object
 */
export function useAgile<X extends Array<SubscribableAgileInstancesType>>(
  deps: X | [],
  config?: AgileHookConfigInterface
): AgileOutputHookArrayType<X>;
/**
 * A React Hook for binding the most relevant Agile Instance value
 * (like the Collection's output or the State's value)
 * to a React Functional Component.
 *
 * This binding ensures that the Component re-renders
 * whenever the most relevant Observer of the Agile Instance mutates.
 *
 * @public
 * @param dep - Agile Sub Instance to be bound to the Functional Component.
 * @param config - Configuration object
 */
export function useAgile<X extends SubscribableAgileInstancesType>(
  dep: X,
  config?: AgileHookConfigInterface
): AgileOutputHookType<X>;
export function useAgile<
  X extends Array<SubscribableAgileInstancesType>,
  Y extends SubscribableAgileInstancesType
>(
  deps: X | Y,
  config: AgileHookConfigInterface = {}
): AgileOutputHookArrayType<X> | AgileOutputHookType<Y> {
  config = defineConfig(config, {
    key: generateId(),
    agileInstance: null as any,
    componentId: undefined,
    observerType: undefined,
    deps: [],
  });
  const depsArray = extractRelevantObservers(
    normalizeArray(deps),
    config.observerType
  );

  const handleReturn = (dep: Observer | undefined) => {
    return dep != null ? dep['value'] : undefined;
  };

  useBaseAgile(
    depsArray,
    () => ({
      key: config.key,
      waitForMount: false,
      componentId: config.componentId,
    }),
    config.deps || [],
    config.agileInstance
  );

  return getReturnValue(depsArray, handleReturn, Array.isArray(deps));
}

export interface AgileHookConfigInterface extends BaseAgileHookConfigInterface {
  /**
   * What type of Observer to be bound to the UI-Component.
   *
   * Note that setting this property can destroy the useAgile type.
   * -> should only be used internal!
   *
   * @default undefined
   */
  observerType?: string;
}

// Array Type
// https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-1.html
export type AgileOutputHookArrayType<T> = {
  [K in keyof T]: T[K] extends Collection<infer U> | Group<infer U>
    ? U[]
    : T[K] extends State<infer U>
    ? U
    : T[K] extends undefined
    ? undefined
    : T[K] extends Collection<infer U> | Group<infer U> | undefined
    ? U[] | undefined
    : T[K] extends State<infer U> | undefined
    ? U | undefined
    : never;
};

// No Array Type
export type AgileOutputHookType<T> = T extends
  | Collection<infer U>
  | Group<infer U>
  ? U[]
  : T extends State<infer U>
  ? U
  : T extends undefined
  ? undefined
  : T extends Collection<infer U> | Group<infer U> | undefined
  ? U[] | undefined
  : T extends State<infer U> | undefined
  ? U | undefined
  : never;
