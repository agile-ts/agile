import React from 'react';
import {
  Agile,
  Collection,
  getAgileInstance,
  Observer,
  State,
  SubscriptionContainerKeyType,
  defineConfig,
  isValidObject,
  generateId,
  ProxyWeakMapType,
  ComponentIdType,
  extractRelevantObservers,
  SelectorWeakMapType,
  SelectorMethodType,
} from '@agile-ts/core';
import { useIsomorphicLayoutEffect } from './useIsomorphicLayoutEffect';
import { normalizeArray } from '@agile-ts/utils';
import { AgileOutputHookArrayType, AgileOutputHookType } from './useOutput';

/**
 * React Hook for binding the most relevant value of multiple Agile Instances
 * (like the Collection's output or the State's value)
 * to a React Functional Component.
 *
 * This binding ensures that the Component re-renders
 * whenever the most relevant value of an Agile Instance mutates.
 *
 * @public
 * @param deps - Agile Instances to be bound to the Functional Component.
 * @param config - Configuration object.
 */
export function useAgile<X extends Array<SubscribableAgileInstancesType>>(
  deps: X | [],
  config?: AgileHookConfigInterface
): AgileOutputHookArrayType<X>;
/**
 * React Hook for binding the most relevant Agile Instance value
 * (like the Collection's output or the State's value)
 * to a React Functional Component.
 *
 * This binding ensures that the Component re-renders
 * whenever the most relevant value of the Agile Instance mutates.
 *
 * @public
 * @param dep - Agile Instance to be bound to the Functional Component.
 * @param config - Configuration object.
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
    proxyBased: false,
    key: generateId(),
    agileInstance: null,
    observerType: undefined,
  });
  const depsArray = extractRelevantObservers(
    normalizeArray(deps),
    config.observerType
  );
  const proxyTreeWeakMap = new WeakMap();

  // Creates Return Value of Hook, depending whether deps are in Array shape or not
  const getReturnValue = (
    depsArray: (Observer | undefined)[]
  ): AgileOutputHookArrayType<X> | AgileOutputHookType<Y> => {
    const handleReturn = (
      dep: Observer | undefined
    ): AgileOutputHookType<Y> => {
      if (dep == null) return undefined as any;
      const value = dep.value;

      // If proxyBased and value is of type object.
      // Wrap a Proxy around the object to track the used properties
      if (config.proxyBased && isValidObject(value, true)) {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const proxyPackage = require('@agile-ts/proxytree');

        if (proxyPackage != null) {
          const proxyTree = new proxyPackage.ProxyTree(value);
          proxyTreeWeakMap.set(dep, proxyTree);
          return proxyTree.proxy;
        } else {
          console.error(
            'To use the AgileTs Proxy functionality, ' +
              'the installation of the `@agile-ts/proxytree` package is required!'
          );
        }
      }

      // If selector and value is of type object.
      // Return the selected value
      if (config.selector && isValidObject(value, true)) {
        return config.selector(value);
      }

      return value;
    };

    // Handle single dep
    if (depsArray.length === 1 && !Array.isArray(deps)) {
      return handleReturn(depsArray[0]);
    }

    // Handle deps array
    return depsArray.map((dep) => {
      return handleReturn(dep);
    }) as AgileOutputHookArrayType<X>;
  };

  // Trigger State, used to force Component to rerender
  const [, forceRender] = React.useReducer((s) => s + 1, 0);

  useIsomorphicLayoutEffect(() => {
    let agileInstance = config.agileInstance;

    // Try to get Agile Instance
    if (!agileInstance) agileInstance = getAgileInstance(depsArray[0]);
    if (!agileInstance || !agileInstance.subController) {
      Agile.logger.error(
        'Failed to subscribe Component with deps because of missing valid Agile Instance.',
        deps
      );
      return;
    }

    // https://github.com/microsoft/TypeScript/issues/20812
    const observers: Observer[] = depsArray.filter(
      (dep): dep is Observer => dep !== undefined
    );

    // TODO Proxy doesn't work as expected when 'selecting' a not yet existing property
    //  -> No Proxy Path could be created on the Component mount
    //  -> No Selector was created based on the Proxy Paths
    //  -> Component rerenders no matter what property has changed
    //
    // Build Proxy Path WeakMap based on the Proxy Tree WeakMap
    // by extracting the routes of the Tree
    // Building the Path WeakMap in the 'useIsomorphicLayoutEffect'
    // because the 'useIsomorphicLayoutEffect' is called after the rerender
    // -> In the Component used paths got successfully tracked
    const proxyWeakMap: ProxyWeakMapType = new WeakMap();
    if (config.proxyBased) {
      for (const observer of observers) {
        const proxyTree = proxyTreeWeakMap.get(observer);
        if (proxyTree != null) {
          proxyWeakMap.set(observer, {
            paths: proxyTree.getUsedRoutes() as any,
          });
        }
      }
    }

    // Build Selector WeakMap based on the specified Selector
    const selectorWeakMap: SelectorWeakMapType = new WeakMap();
    if (config.selector != null) {
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
        selectorWeakMap: selectorWeakMap,
      }
    );

    // Unsubscribe Callback based Subscription on Unmount
    return () => {
      agileInstance?.subController.unsubscribe(subscriptionContainer);
    };
  }, []);

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
   * based on the properties used of the object.
   *
   * Requires an additional dependency called `@agile-ts/proxytree`!
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
   * Key/Name identifier of UI-Component the Subscription Container is bound to.
   * @default undefined
   */
  componentId?: ComponentIdType;
  /**
   * What type of Observer to be bound to the UI-Component.
   * @default undefined
   */
  observerType?: string;
}
