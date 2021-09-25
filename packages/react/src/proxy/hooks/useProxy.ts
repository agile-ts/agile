import {
  defineConfig,
  extractRelevantObservers,
  Observer,
  ProxyWeakMapType,
} from '@agile-ts/core';
import { generateId, isValidObject, normalizeArray } from '@agile-ts/utils';
import {
  AgileHookConfigInterface,
  AgileOutputHookArrayType,
  AgileOutputHookType,
  getReturnValue,
  SubscribableAgileInstancesType,
  useBaseAgile,
} from '../../core';
import { proxyPackage } from '../proxyPackage';
import { logCodeManager } from '../../logCodeManager';

/**
 * A React Hook for binding the most relevant value of multiple Agile Instances
 * (like the Collection's output or the State's value)
 * to a React Functional Component.
 *
 * This binding ensures that the Component re-renders
 * whenever the most relevant Observer of an Agile Instance mutates.
 *
 * In addition the the default 'useAgile' Hook,
 * the useProxy Hooks wraps a [Proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy)
 * around the to bind Agile Instance value objects,
 * to automatically constraint the way the selected Agile Instances
 * are compared to determine whether the React Component needs to be re-rendered
 * based on the object's used properties.
 *
 * @public
 * @param deps - Agile Sub Instances to be bound to the Functional Component.
 * @param config - Configuration object
 */
export function useProxy<X extends Array<SubscribableAgileInstancesType>>(
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
 * In addition the the default 'useAgile' Hook,
 * the useProxy Hooks wraps a [Proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy)
 * around the to bind Agile Instance value objects,
 * to automatically constraint the way the selected Agile Instances
 * are compared to determine whether the React Component needs to be re-rendered
 * based on the object's used properties.
 *
 * @public
 * @param dep - Agile Sub Instance to be bound to the Functional Component.
 * @param config - Configuration object
 */
export function useProxy<X extends SubscribableAgileInstancesType>(
  dep: X,
  config?: AgileHookConfigInterface
): AgileOutputHookType<X>;

export function useProxy<
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
    deps: [],
  });
  const depsArray = extractRelevantObservers(normalizeArray(deps));
  const proxyTreeWeakMap = new WeakMap();

  // Return if '@agile-ts/proxytree' isn't installed
  if (proxyPackage == null) {
    logCodeManager.log('31:03:00');
    return null as any;
  }

  const handleReturn = (dep: Observer | undefined) => {
    if (dep == null) return undefined as any;
    const value = dep.value;

    // If proxyBased and the value is of the type object.
    // Wrap a Proxy around the object to track the accessed properties.
    if (isValidObject(value, true)) {
      const proxyTree = new proxyPackage.ProxyTree(value);
      proxyTreeWeakMap.set(dep, proxyTree);
      return proxyTree.proxy;
    }

    return value;
  };

  useBaseAgile(
    depsArray,
    (observers) => {
      // TODO Proxy doesn't work as expected when 'selecting' a not yet existing property.
      //  For example you select the 'user.data.name' property, but the 'user' object is undefined.
      //  -> No correct Proxy Path could be created on the Component mount, since the to select property doesn't exist
      //  -> Selector was created based on the not complete Proxy Path
      //  -> Component re-renders to often
      //
      // Build Proxy Path WeakMap based on the Proxy Tree WeakMap
      // by extracting the routes from the Proxy Tree.
      // Building the Path WeakMap in the 'useIsomorphicLayoutEffect'
      // because the 'useIsomorphicLayoutEffect' is called after the rerender.
      // -> All used paths in the UI-Component were successfully tracked.
      let proxyWeakMap: ProxyWeakMapType | undefined = undefined;
      proxyWeakMap = new WeakMap();
      for (const observer of observers) {
        const proxyTree = proxyTreeWeakMap.get(observer);
        if (proxyTree != null) {
          proxyWeakMap.set(observer, {
            paths: proxyTree.getUsedRoutes() as any,
          });
        }
      }

      return {
        key: config.key,
        waitForMount: false,
        componentId: config.componentId,
        proxyWeakMap,
      };
    },
    config.deps || [],
    config.agileInstance
  );

  return getReturnValue(depsArray, handleReturn, Array.isArray(deps));
}
