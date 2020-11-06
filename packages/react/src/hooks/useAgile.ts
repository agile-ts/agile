import React from "react";
import {
  Agile,
  Collection,
  getAgileInstance,
  Group,
  normalizeArray,
  State,
  StateObserver,
} from "@agile-ts/core";

// Array Type
// https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-1.html
type AgileHookArrayType<T> = {
  [K in keyof T]: T[K] extends Group<infer U>
    ? U[]
    : T[K] extends State<infer U>
    ? U
    : T[K] extends Collection<infer U>
    ? U[]
    : T[K] extends undefined
    ? undefined
    : never;
};

// No Array Type
type AgileHookType<T> = T extends Group<infer U>
  ? U[]
  : T extends State<infer U>
  ? U
  : T extends Collection<infer U>
  ? U[]
  : T extends undefined
  ? undefined
  : never;

/**
 * React Hook that subscribes a React Functional Component to an Agile Instance like Collection, State, Computed, ..
 * @param deps - Agile Instances that will be subscribed to this Component
 * @param agileInstance - An instance of Agile
 */
export function useAgile<X extends Array<State | Collection | undefined>>(
  deps: X | [],
  agileInstance?: Agile
): AgileHookArrayType<X>;

/**
 * React Hook that subscribes a React Functional Component to an Agile Instance like Collection, State, Computed, ..
 * @param dep - Agile Instance that will be subscribed to this Component
 * @param agileInstance - An instance of Agile
 */
export function useAgile<X extends State | Collection | undefined>(
  dep: X,
  agileInstance?: Agile
): AgileHookType<X>;

export function useAgile<
  X extends Array<State | Collection | undefined>,
  Y extends State | Collection | undefined
>(
  deps: X | Y,
  agileInstance?: Agile
): AgileHookArrayType<X> | AgileHookType<Y> {
  // Normalize Dependencies and special Agile Instance Types like Collection
  const depsArray = normalizeArray(deps).map((item) =>
    item instanceof Collection
      ? item.getGroup(item.config.defaultGroupKey || "default")
      : item
  );

  // Creates Return Value of Hook, depending if deps are in Array shape or not
  const getReturnValue = (
    depsArray: (State | undefined)[]
  ): AgileHookArrayType<X> | AgileHookType<Y> => {
    if (depsArray.length === 1 && !Array.isArray(deps))
      return depsArray[0]?.getPublicValue() as AgileHookType<Y>;

    return depsArray.map((state) => {
      return state?.getPublicValue();
    }) as AgileHookArrayType<X>;
  };

  // Trigger State used to force the component to rerender
  const [_, set_] = React.useState({});

  React.useEffect(() => {
    // Get Agile Instance
    if (!agileInstance) agileInstance = getAgileInstance(depsArray[0]);

    // https://github.com/microsoft/TypeScript/issues/20812
    const observers: StateObserver[] = depsArray
      .map((dep) => dep?.observer)
      .filter((dep): dep is StateObserver => dep !== undefined);

    // Create Callback based Subscription
    const subscriptionContainer = agileInstance?.subController.subscribeWithSubsArray(
      () => {
        set_({});
      },
      observers
    );

    // Unsubscribe Callback based Subscription on Unmount
    return () => {
      agileInstance?.subController.unsubscribe(subscriptionContainer);
    };
  }, []);

  return getReturnValue(depsArray);
}
