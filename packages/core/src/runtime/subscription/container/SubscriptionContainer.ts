import {
  defineConfig,
  generateId,
  isValidObject,
  Observer,
} from '../../../internal';

export class SubscriptionContainer {
  /**
   * Key/Name identifier of the Subscription Container.
   */
  public key?: SubscriptionContainerKeyType;
  /**
   * Whether the Subscription Container
   * and the UI-Component it represents are ready.
   *
   * When both instances are ready,
   * the Subscription Container is allowed
   * to trigger re-renders on the UI-Component.
   */
  public ready = false;
  /**
   * Unique identifier of the UI-Component
   * the Subscription Container represents.
   */
  public componentId?: ComponentIdType;

  /**
   * Observers that are subscribed to the Subscription Container.
   *
   * The subscribed Observers use the Subscription Container
   * as an interface to the UI-Component it represents.
   *
   * Through the Subscription Container, the Observers can easily trigger re-renders
   * on the UI-Component, for example, when their value updates.
   *
   * [Learn more..](https://agile-ts.org/docs/core/integration#-subscriptions)
   */
  public subscribers: Set<Observer>;
  /**
   * Temporary stores the subscribed Observers,
   * that were updated by the runtime
   * and are currently running through
   * the update (rerender) Subscription Container (UI-Component) process.
   */
  public updatedSubscribers: Set<Observer> = new Set();

  /**
   * Whether the Subscription Container is object based.
   *
   * A Subscription Container is object based when the subscribed Observers
   * have been provided in an Observer keymap object
   * ```
   * {
   *   state1: Observer,
   *   state2: Observer
   * }
   * ```
   * Thus each Observer has its 'external' unique key stored in the `subscribersWeakMap`.
   *
   * Often Component based Subscriptions are object based,
   * because each Observer requires in such Subscription a unique identifier.
   * Mainly to be properly represented in the `updatedData` object
   * sent to the Integration's `updateMethod()` method
   * when the Subscription Container updates (re-renders the UI-Component).
   */
  public isObjectBased = false;
  /**
   * Weak map for storing 'external' key identifiers for subscribed Observers.
   *
   * Why is the key not applied directly to the Observer?
   *
   * Because the key defined here should be only valid
   * for the scope of the Subscription Container.
   *
   * https://stackoverflow.com/questions/29413222/what-are-the-actual-uses-of-es6-weakmap
   */
  public subscriberKeysWeakMap: WeakMap<Observer, string>;

  /**
   * Weak Map for storing selector functions for subscribed Observers.
   *
   * A selector function allows the partial subscription to an Observer value.
   * Only when the selected Observer value part changes,
   * the Subscription Container is updated (-> re-renders the UI-Component).
   *
   * Why are the selector functions not applied directly to the Observer?
   *
   * Because the selector function defined here should be only valid
   * for the scope of the Subscription Container.
   *
   * https://stackoverflow.com/questions/29413222/what-are-the-actual-uses-of-es6-weakmap
   */
  public selectorsWeakMap: SelectorWeakMapType;

  /**
   * A Subscription Container represents a UI-Component in AgileTs
   * that can be subscribed by multiple Observer Instances.
   *
   * The subscribed Observers can use the Subscription Container as an interface
   * to the UI-Component it represents.
   * For example, to trigger re-renders on the UI-Component,
   * when their value has changed.
   *
   * @internal
   * @param subs - Observers to be initial subscribed to the Subscription Container.
   * @param config - Configuration object
   */
  constructor(
    subs: Array<Observer> | { [key: string]: Observer },
    config: SubscriptionContainerConfigInterface = {}
  ) {
    config = defineConfig(config, {
      key: generateId(),
    });

    this.subscribers = new Set();
    this.key = config.key;
    this.componentId = config?.componentId;
    this.subscriberKeysWeakMap = new WeakMap();
    this.selectorsWeakMap = new WeakMap();
    this.isObjectBased = !Array.isArray(subs);

    // Assign initial Observers to the Subscription Container
    for (const key in subs) {
      this.addSubscription(subs[key], {
        proxyPaths: config.proxyWeakMap?.get(subs[key])?.paths,
        selectorMethods: config.selectorWeakMap?.get(subs[key])?.methods,
        key: this.isObjectBased ? key : undefined,
      });
    }
  }

  /**
   * Subscribes the specified Observer to the Subscription Container.
   *
   * @internal
   * @param sub - Observer to be subscribed to the Subscription Container
   * @param config - Configuration object
   */
  public addSubscription(
    sub: Observer,
    config: AddSubscriptionMethodConfigInterface = {}
  ): void {
    const toAddSelectorMethods: SelectorMethodType[] =
      config.selectorMethods ?? [];
    const proxyPaths = config.proxyPaths ?? [];

    // Create additional selector methods based on the specified proxy paths
    for (const path of proxyPaths) {
      toAddSelectorMethods.push((value) => {
        let _value = value;
        for (const branch of path) {
          if (!isValidObject(_value, true)) break;
          _value = _value[branch];
        }
        return _value;
      });
    }

    // Assign defined/created selector methods to the 'selectorsWeakMap'
    // (Not to the Observer itself, since the selector methods specified here
    // only count for the scope of the Subscription Container)
    const existingSelectorMethods =
      this.selectorsWeakMap.get(sub)?.methods ?? [];
    const newSelectorMethods = existingSelectorMethods.concat(
      toAddSelectorMethods
    );
    if (newSelectorMethods.length > 0)
      this.selectorsWeakMap.set(sub, { methods: newSelectorMethods });

    // Assign specified key to the 'subscriberKeysWeakMap'
    // (Not to the Observer itself, since the key specified here
    // only counts for the scope of the Subscription Container)
    if (config.key != null) this.subscriberKeysWeakMap.set(sub, config.key);

    // Add Observer to subscribers
    this.subscribers.add(sub);

    // Add Subscription Container to Observer
    // so that the Observer can cause updates on it
    // (trigger re-render on the UI-Component it represents).
    sub.subscribedTo.add(this);
  }

  /**
   * Unsubscribes the specified Observer from the Subscription Container.
   *
   * @internal
   * @param sub - Observer to be unsubscribed from the Subscription Container.
   */
  public removeSubscription(sub: Observer) {
    if (this.subscribers.has(sub)) {
      this.selectorsWeakMap.delete(sub);
      this.subscriberKeysWeakMap.delete(sub);
      this.subscribers.delete(sub);
      sub.subscribedTo.delete(this);
    }
  }
}

export type SubscriptionContainerKeyType = string | number;

export interface SubscriptionContainerConfigInterface {
  /**
   * Key/Name identifier of the Subscription Container
   * @default undefined
   */
  key?: SubscriptionContainerKeyType;
  /**
   * Key/Name identifier of the UI-Component to be represented by the Subscription Container.
   * @default undefined
   */
  componentId?: ComponentIdType;
  /**
   * A Weak Map with a set of proxy paths to certain properties
   * in an Observer value for subscribed Observers.
   *
   * These paths are then selected via selector functions
   * which allow the partly subscription to an Observer value.
   * Only if the selected Observer value part changes,
   * the Subscription Container re-renders the UI-Component it represents.
   *
   * For example:
   * ```
   * WeakMap: {
   *   Observer1: {paths: [['data', 'name']]},
   *   Observer2: {paths: [['car', 'speed']]}
   * }
   * ```
   * Now the Subscription Container will only trigger a re-render on the UI-Component
   * if 'data.name' in Observer1 or 'car.speed' in Observer2 updates.
   * If, for instance, 'data.age' in Observer1 mutates it won't trigger a re-render,
   * since 'data.age' isn't represented in the specified Proxy Weak Map.
   *
   * These particular paths can, for example, be tracked via the ProxyTree.
   * https://github.com/agile-ts/agile/tree/master/packages/proxytree
   *
   * @default new WeakMap()
   */
  proxyWeakMap?: ProxyWeakMapType;
  /**
   * A Weak Map with a set of selector functions for Observers.
   *
   * Selector functions allow the partly subscription to Observer values.
   * Only if the selected Observer value part changes,
   * the Subscription Container re-renders the UI-Component it represents.
   *
   * For example:
   * ```
   * WeakMap: {
   *   Observer1: {methods: [(value) => value.data.name]},
   *   Observer2: {methods: [(value) => value.car.speed]}
   * }
   * ```
   * Now the Subscription Container will only trigger a re-render on the UI-Component
   * if 'data.name' in Observer1 or 'car.speed' in Observer2 updates.
   * If, for instance, 'data.age' in Observer1 mutates it won't trigger a re-render,
   * since 'data.age' isn't selected by any selector method in the specified Selector Weak Map.
   *
   * @default new WeakMap()
   */
  selectorWeakMap?: SelectorWeakMapType;
}

export interface AddSubscriptionMethodConfigInterface {
  proxyPaths?: ProxyPathType[];
  selectorMethods?: SelectorMethodType[];
  key?: string;
}

export type ProxyPathType = string[];
export type ProxyWeakMapType = WeakMap<Observer, { paths: ProxyPathType[] }>;

export type SelectorMethodType<T = any> = (value: T) => any;
export type SelectorWeakMapType<T = any> = WeakMap<
  Observer,
  { methods: SelectorMethodType<T>[] }
>;

export type ComponentIdType = string | number;
