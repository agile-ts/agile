import React from "react";
import {
  Agile,
  Collection,
  getAgileInstance,
  Group,
  normalizeArray,
  Observer,
  State,
} from "@agile-ts/core";

// Array Type
// https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-1.html
type AgileHookArrayType<T> = {
  [K in keyof T]: T[K] extends Group<infer U>
    ? U[]
    : T[K] extends State<infer U>
    ? U
    : T[K] extends Observer<infer U>
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
  : T extends Observer<infer U>
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
export function useAgile<
  X extends Array<State | Collection | Observer | undefined>
>(deps: X | [], agileInstance?: Agile): AgileHookArrayType<X>;

/**
 * React Hook that subscribes a React Functional Component to an Agile Instance like Collection, State, Computed, ..
 * @param dep - Agile Instance that will be subscribed to this Component
 * @param agileInstance - An instance of Agile
 */
export function useAgile<X extends State | Collection | Observer | undefined>(
  dep: X,
  agileInstance?: Agile
): AgileHookType<X>;

export function useAgile<
  X extends Array<State | Collection | Observer | undefined>,
  Y extends State | Collection | Observer | undefined
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
    depsArray: (State | Observer | undefined)[]
  ): AgileHookArrayType<X> | AgileHookType<Y> => {
    if (depsArray.length === 1 && !Array.isArray(deps))
      return depsArray[0] instanceof Observer
        ? depsArray[0]?.value
        : (depsArray[0]?.getPublicValue() as AgileHookType<Y>);

    return depsArray.map((dep) => {
      return dep instanceof Observer ? dep?.value : dep?.getPublicValue();
    }) as AgileHookArrayType<X>;
  };

  // Trigger State used to force the component to rerender
  const [_, set_] = React.useState({});

  React.useEffect(() => {
    // Get Agile Instance
    if (!agileInstance) agileInstance = getAgileInstance(depsArray[0]);

    if (!agileInstance || !agileInstance.subController) {
      console.error(
        "Agile: Failed to subscribe Component with deps",
        depsArray
      );
      return;
    }

    // https://github.com/microsoft/TypeScript/issues/20812
    const observers: Observer[] = depsArray
      .map((dep) => (dep instanceof Observer ? dep : dep?.observer))
      .filter((dep): dep is Observer => dep !== undefined);

    // Create Callback based Subscription
    const subscriptionContainer = agileInstance.subController.subscribeWithSubsArray(
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
