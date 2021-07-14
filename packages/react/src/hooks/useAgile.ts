import React from 'react';
import {
  Agile,
  Collection,
  getAgileInstance,
  Observer,
  State,
  SubscriptionContainerKeyType,
  isValidObject,
  generateId,
  ProxyWeakMapType,
  ComponentIdType,
  extractRelevantObservers,
  SelectorWeakMapType,
  SelectorMethodType,
  LogCodeManager,
  normalizeArray,
  defineConfig,
} from '@agile-ts/core';
import { useIsomorphicLayoutEffect } from './useIsomorphicLayoutEffect';
import { AgileOutputHookArrayType, AgileOutputHookType } from './useOutput';

// TODO https://stackoverflow.com/questions/68148235/require-module-inside-a-function-doesnt-work
let proxyPackage: any = null;
try {
  proxyPackage = require('@agile-ts/proxytree');
} catch (e) {
  // empty catch block
}

/**
 * A React Hook for binding the most relevant value of multiple Agile Instances
 * (like the Collection's output or the State's value)
 * to a React Functional Component.
 *
 * This binding ensures that the Component re-renders
 * whenever the most relevant Observer of an Agile Instance mutates.
 *
 * @public
 * @param deps - Agile Instances to be bound to the Functional Component.
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
 * @param dep - Agile Instance to be bound to the Functional Component.
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
    proxyBased: false,
    agileInstance: null as any,
    componentId: undefined,
    observerType: undefined,
    deps: [],
  });
  const depsArray = extractRelevantObservers(
    normalizeArray(deps),
    config.observerType
  );
  const proxyTreeWeakMap = new WeakMap();

  // Builds return value,
  // depending on whether the deps were provided in array shape or not
  const getReturnValue = (
    depsArray: (Observer | undefined)[]
  ): AgileOutputHookArrayType<X> | AgileOutputHookType<Y> => {
    const handleReturn = (
      dep: Observer | undefined
    ): AgileOutputHookType<Y> => {
      if (dep == null) return undefined as any;
      const value = dep.value;

      // If proxyBased and the value is of the type object.
      // Wrap a Proxy around the object to track the accessed properties.
      if (config.proxyBased && isValidObject(value, true)) {
        if (proxyPackage != null) {
          const { ProxyTree } = proxyPackage;
          const proxyTree = new ProxyTree(value);
          proxyTreeWeakMap.set(dep, proxyTree);
          return proxyTree.proxy;
        } else {
          console.error(
            'In order to use the Agile proxy functionality, ' +
              `the installation of an additional package called '@agile-ts/proxytree' is required!`
          );
        }
      }

      // If specified selector function and the value is of type object.
      // Return the selected value.
      // (Destroys the type of the useAgile hook,
      // however the type is adjusted in the useSelector hook)
      if (config.selector && isValidObject(value, true)) {
        return config.selector(value);
      }

      return value;
    };

    // Handle single dep return value
    if (depsArray.length === 1 && !Array.isArray(deps)) {
      return handleReturn(depsArray[0]);
    }

    // Handle deps array return value
    return depsArray.map((dep) => {
      return handleReturn(dep);
    }) as AgileOutputHookArrayType<X>;
  };

  // Trigger State, used to force Component to rerender
  const [, forceRender] = React.useReducer((s) => s + 1, 0);

  useIsomorphicLayoutEffect(() => {
    let agileInstance = config.agileInstance;

    // https://github.com/microsoft/TypeScript/issues/20812
    const observers: Observer[] = depsArray.filter(
      (dep): dep is Observer => dep !== undefined
    );

    // Try to extract Agile Instance from the specified Instance/s
    if (!agileInstance) agileInstance = getAgileInstance(observers[0]);
    if (!agileInstance || !agileInstance.subController) {
      LogCodeManager.getLogger()?.error(
        'Failed to subscribe Component with deps because of missing valid Agile Instance.',
        deps
      );
      return;
    }

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
    if (config.proxyBased && proxyPackage != null) {
      proxyWeakMap = new WeakMap();
      for (const observer of observers) {
        const proxyTree = proxyTreeWeakMap.get(observer);
        if (proxyTree != null) {
          proxyWeakMap.set(observer, {
            paths: proxyTree.getUsedRoutes() as any,
          });
        }
      }
    }

    // Build Selector WeakMap based on the specified selector method
    let selectorWeakMap: SelectorWeakMapType | undefined = undefined;
    if (config.selector != null) {
      selectorWeakMap = new WeakMap();
      for (const observer of observers) {
        selectorWeakMap.set(observer, { methods: [config.selector] });
      }
    }

    // Create Callback based Subscription
    const subscriptionContainer = agileInstance.subController.subscribe(
      () => {
        forceRender();
      },
      observers,
      {
        key: config.key,
        proxyWeakMap,
        waitForMount: false,
        componentId: config.componentId,
        selectorWeakMap,
      }
    );

    // Unsubscribe Callback based Subscription on unmount
    return () => {
      agileInstance?.subController.unsubscribe(subscriptionContainer);
    };
  }, config.deps);

  return getReturnValue(depsArray);
}

export type SubscribableAgileInstancesType =
  | State
  | Collection<any> //https://stackoverflow.com/questions/66987727/type-classa-id-number-name-string-is-not-assignable-to-type-classar
  | Observer
  | undefined;

export interface AgileHookConfigInterface {
  /**
   * Key/Name identifier of the Subscription Container to be created.
   * @default undefined
   */
  key?: SubscriptionContainerKeyType;
  /**
   * Instance of Agile the Subscription Container belongs to.
   * @default `undefined` if no Agile Instance could be extracted from the provided Instances.
   */
  agileInstance?: Agile;
  /**
   * Whether to wrap a [Proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy)
   * around the bound Agile Instance value object,
   * to automatically constrain the way the selected Agile Instance
   * is compared to determine whether the Component needs to be re-rendered
   * based on the object's used properties.
   *
   * Requires an additional package called `@agile-ts/proxytree`!
   *
   * @default false
   */
  proxyBased?: boolean;
  /**
   * Equality comparison function
   * that allows you to customize the way the selected Agile Instance
   * is compared to determine whether the Component needs to be re-rendered.
   * @default undefined
   */
  selector?: SelectorMethodType;
  /**
   * Key/Name identifier of the UI-Component the Subscription Container is bound to.
   *
   * Note that setting this property can destroy the useAgile type.
   * -> should only be used internal!
   *
   * @default undefined
   */
  componentId?: ComponentIdType;
  /**
   * What type of Observer to be bound to the UI-Component.
   *
   * Note that setting this property can destroy the useAgile type.
   * -> should only be used internal!
   *
   * @default undefined
   */
  observerType?: string;
  /**
   * Dependencies that determine, in addition to unmounting and remounting the React-Component,
   * when the specified Agile Sub Instances should be re-subscribed to the React-Component.
   *
   * [Github issue](https://github.com/agile-ts/agile/issues/170)
   *
   * @default []
   */
  deps?: any[];
}
