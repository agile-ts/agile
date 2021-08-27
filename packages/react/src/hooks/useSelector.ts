import {
  SelectorMethodType,
  defineConfig,
  Observer,
  SelectorWeakMapType,
  extractRelevantObservers,
} from '@agile-ts/core';
import { generateId, isValidObject } from '@agile-ts/utils';
import {
  BaseAgileHookConfigInterface,
  getReturnValue,
  SubscribableAgileInstancesType,
  useBaseAgile,
} from './useBaseAgile';
import { AgileValueHookType } from './useValue';

export function useSelector<
  ReturnType,
  X extends SubscribableAgileInstancesType,
  ValueType extends AgileValueHookType<X>
>(
  dep: X,
  selector: SelectorMethodType<ValueType>,
  config?: BaseAgileHookConfigInterface
): ReturnType;

export function useSelector<ValueType = any, ReturnType = any>(
  dep: SubscribableAgileInstancesType,
  selector: SelectorMethodType<ValueType>,
  config?: BaseAgileHookConfigInterface
): ReturnType;

export function useSelector<
  X extends SubscribableAgileInstancesType,
  ValueType extends AgileValueHookType<X>,
  ReturnType = any
>(
  dep: X,
  selector: SelectorMethodType<ValueType>,
  config: BaseAgileHookConfigInterface = {}
): ReturnType {
  config = defineConfig(config, {
    key: generateId(),
    agileInstance: null as any,
    componentId: undefined,
  });
  const depsArray = extractRelevantObservers([dep]);

  const handleReturn = (dep: Observer | undefined): any => {
    if (dep == null) return undefined as any;
    const value = dep.value;

    // If specified selector function and the value is of type object.
    // Return the selected value.
    // (Destroys the type of the useAgile hook,
    // however the type can be adjusted in the useSelector hook)
    if (isValidObject(value, true)) {
      return selector(value);
    }

    return value;
  };

  useBaseAgile(
    depsArray,
    (observers) => {
      // Build Selector WeakMap based on the specified selector method
      let selectorWeakMap: SelectorWeakMapType | undefined = undefined;
      selectorWeakMap = new WeakMap();
      for (const observer of observers) {
        selectorWeakMap.set(observer, { methods: [selector] });
      }

      return {
        key: config.key,
        waitForMount: false,
        componentId: config.componentId,
        selectorWeakMap,
      };
    },
    config.deps || [],
    config.agileInstance
  );

  return getReturnValue(depsArray, handleReturn, false);
}
