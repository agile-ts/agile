import {
  Group,
  State,
  Collection,
  Agile,
  getAgileInstance,
  normalizeArray,
  Observer,
} from "../../../src";

//=========================================================================================================
// Use Test Hook
// NOTE: This is only used for Tests
//=========================================================================================================

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

export function useAgile_Test<
  X extends Array<State | Collection | Observer | undefined>
>(
  deps: X | [],
  callbackFunction?: Function,
  agileInstance?: Agile
): AgileHookArrayType<X>;
export function useAgile_Test<
  X extends State | Collection | Observer | undefined
>(dep: X, callbackFunction: Function, agileInstance?: Agile): AgileHookType<X>;

export function useAgile_Test<
  X extends Array<State | Collection | Observer | undefined>,
  Y extends State | Collection | Observer | undefined
>(
  deps: X | Y,
  callbackFunction: Function,
  agileInstance?: Agile
): AgileHookArrayType<X> | AgileHookType<Y> {
  // Normalize Dependencies and special Agile Instance Types like Collection
  const depsArray = normalizeArray(deps, {
    createUndefinedArray: true,
  }).map((item) =>
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

  // Get Agile Instance
  if (!agileInstance) agileInstance = getAgileInstance(depsArray[0]);

  if (!agileInstance || !agileInstance.subController) {
    console.error("Agile: Failed to subscribe Component with deps", depsArray);
    return;
  }

  // https://github.com/microsoft/TypeScript/issues/20812
  const observers: Observer[] = depsArray
    .map((dep) => (dep instanceof Observer ? dep : dep?.observer))
    .filter((dep): dep is Observer => dep !== undefined);

  // Create Callback based Subscription
  const subscriptionContainer = agileInstance.subController.subscribeWithSubsArray(
    () => {
      callbackFunction();
    },
    observers
  );

  return getReturnValue(depsArray);
}
