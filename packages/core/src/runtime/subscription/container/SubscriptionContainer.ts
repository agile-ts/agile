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
   * and the Component the Subscription Container represents are ready.
   *
   * When both are ready, the Subscription Container is allowed
   * to trigger rerender on the Component.
   */
  public ready = false;
  /**
   * Unique identifier of the Component the Subscription Container represents.
   */
  public componentId?: ComponentIdType;

  /**
   * Observers that have subscribed the Subscription Container.
   *
   * The subscribed Observers use the Subscription Container
   * as an interface to the Component it represents.
   * Through the Subscription Container, they can easily trigger rerender
   * on the Component, for example, when their value changes.
   *
   * [Learn more..](https://agile-ts.org/docs/core/integration#-subscriptions)
   */
  public subscribers: Set<Observer>;
  /**
   * Temporary stores the subscribed Observers,
   * that were performed by the runtime
   * and are currently running through the update Subscription Container (rerender) process.
   */
  public updatedSubscribers: Set<Observer> = new Set();

  /**
   * Whether the Subscription Container is object based.
   *
   * An Observer is object based when the subscribed Observers
   * have been provided in an Observer key map.
   * ```
   * {
   *   state1: Observer,
   *   state2: Observer
   * }
   * ```
   * Thus each Observer has its 'external' unique key stored in the 'subscribersWeakMap'.
   *
   * Often Component based Subscriptions are object based,
   * because each Observer requires a unique identifier
   * to be properly represented in the 'updatedData' object sent to the Integration 'updateMethod()'.
   */
  public isObjectBased = false;
  /**
   * Weak map for storing 'external' key identifiers for subscribed Observers.
   *
   * https://stackoverflow.com/questions/29413222/what-are-the-actual-uses-of-es6-weakmap
   */
  public subscriberKeysWeakMap: WeakMap<Observer, string>;

  /**
   * Weak Map for storing selector functions for subscribed Observers.
   *
   * A selector function allows partial subscription to an Observer value.
   * Only when the selected Observer value part changes,
   * the Subscription Container rerender the Component.
   *
   * https://stackoverflow.com/questions/29413222/what-are-the-actual-uses-of-es6-weakmap
   */
  public selectorsWeakMap: SelectorWeakMapType;

  /**
   * A Subscription Container represents a UI-Component in AgileTs
   * that can be subscribed by multiple Observer Instances.
   *
   * These Observers use the Subscription Container as an interface
   * to trigger a rerender on the UI-Component it represents,
   * for example, when their value has changed.
   *
   * @internal
   * @param subs - Observers to be subscribed to the Subscription Container.
   * @param config - Configuration object
   */
  constructor(
    subs: Array<Observer> | { [key: string]: Observer },
    config: SubscriptionContainerConfigInterface = {}
  ) {
    config = defineConfig(config, {
      proxyWeakMap: new WeakMap(),
      selectorWeakMap: new WeakMap(),
      key: generateId(),
    });

    this.subscribers = new Set();
    this.key = config.key;
    this.componentId = config?.componentId;
    this.subscriberKeysWeakMap = new WeakMap();
    this.selectorsWeakMap = new WeakMap();
    this.isObjectBased = !Array.isArray(subs);

    for (const key in subs) {
      const sub = subs[key];
      this.addSubscription(sub, {
        proxyPaths: config.proxyWeakMap?.get(sub)?.paths,
        selectorMethods: config.selectorWeakMap?.get(sub)?.methods,
        key: !Array.isArray(subs) ? key : undefined,
      });
    }
  }

  /**
   * Adds specified Observer to the `subscription` array
   * and its selectors to the `selectorsWeakMap`.
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
    const paths = config.proxyPaths ?? [];

    // Create selector methods based on the specified proxy paths
    for (const path of paths) {
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
    const existingSelectorMethods =
      this.selectorsWeakMap.get(sub)?.methods ?? [];
    const newSelectorMethods = existingSelectorMethods.concat(
      toAddSelectorMethods
    );
    if (newSelectorMethods.length > 0)
      this.selectorsWeakMap.set(sub, { methods: newSelectorMethods });

    // Assign specified key to the 'subscriberKeysWeakMap'
    // (Not to the Observer itself, since the key specified here only counts for this Subscription Container)
    if (config.key != null) this.subscriberKeysWeakMap.set(sub, config.key);

    // Add Observer to subscribers
    this.subscribers.add(sub);

    // Add Subscription Container to Observer
    // so that it can be updated (cause rerender on the Component it represents)
    // when for example the Observer value changes
    sub.subscribedTo.add(this);
  }

  /**
   * Removes the Observer from the Subscription Container
   * and from all WeakMaps it might be in.
   *
   * @internal
   * @param sub - Observer to be removed from the Subscription Container
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
   * Key/Name identifier of the Component to be represented by the Subscription Container.
   * @default undefined
   */
  componentId?: ComponentIdType;
  /**
   * A Weak Map with a set of paths to certain properties
   * in a Observer value for Observers.
   *
   * These paths are then selected via selector functions
   * which allow the partly subscription to an Observer value.
   * Only if the selected Observer value part changes,
   * the Subscription Container rerender the Component.
   *
   * For example:
   * ```
   * WeakMap: {
   *   Observer1: {paths: [['data', 'name']]},
   *   Observer2: {paths: [['car', 'speed']]}
   * }
   * ```
   * Now the Subscription Container will only trigger a rerender on the Component
   * if 'data.name' in Observer1 or 'car.speed' in Observer2 changes.
   * If, for instance, 'data.age' in Observer1 mutates it won't trigger a rerender,
   * since 'data.age' isn't represented in the Proxy Weak Map.
   *
   * These particular paths were tracked via the ProxyTree.
   * https://github.com/agile-ts/agile/tree/master/packages/proxytree
   *
   * @default new WeakMap()
   */
  proxyWeakMap?: ProxyWeakMapType;
  /**
   * A Weak Map with a set of selector functions for Observers.
   *
   * A selector functions allows the partly subscription to an Observer value.
   * Only if the selected Observer value part changes,
   * the Subscription Container rerender the Component.
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
