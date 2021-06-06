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
   * So that the Subscription Container can trigger rerenders on the Component.
   */
  public ready = false;

  /**
   * Observers that have subscribed the Subscription Container.
   *
   * The Observers use the Subscription Container
   * as an interface to the Component the Subscription Container represents
   * in order to cause rerenders on the Component.
   */
  public subscribers: Set<Observer>;
  /**
   * Temporary stores the subscribed Observers,
   * that have been updated and are running through the runtime.
   */
  public updatedSubscribers: Array<Observer> = [];

  /**
   * Whether the Subscription Container is object based.
   *
   * A Observer is object based when the subscribed Observers were provided in a Observer key map.
   * ```
   * {
   *   state1: Observer,
   *   state2: Observer
   * }
   * ```
   * Thus each Observer has its unique key stored in the 'subscribersWeakMap'.
   *
   * Often Component based Subscriptions are object based,
   * because each Observer requires a unique identifier
   * to properly merge the Observer value into the local State Management instance.
   */
  public isObjectBased = false;
  /**
   * Weak map for storing a key identifier for each Observer.
   */
  public subscriberKeysWeakMap: WeakMap<Observer, string>;

  /**
   * Weak map representing Selectors of the Subscription Container.
   */
  public selectorsWeakMap: SelectorWeakMapType;

  /**
   * SubscriptionContainer - Represents Component/(Way to rerender Component) that is subscribed by Observer/s (Agile)
   * -> Used to cause rerender on Component
   *
   *
   * A Subscription Container is like an interface to the Components.
   *
   * When a subscribed Observer value mutates a rerender is triggered on the Component
   * through the Subscription Container.
   *
   * @internal
   * @param subs - Observers to be subscribed to the Subscription Container.
   * @param config - Configuration object
   */
  constructor(
    subs: Array<Observer> = [],
    config: SubscriptionContainerConfigInterface = {}
  ) {
    config = defineConfig(config, {
      proxyWeakMap: new WeakMap(),
      selectorWeakMap: new WeakMap(),
      key: generateId(),
    });

    this.subscribers = new Set(subs);
    this.key = config.key;
    this.subscriberKeysWeakMap = new WeakMap();

    // Create for each proxy path a Selector,
    // which selects the property at the path
    const selectorWeakMap: SelectorWeakMapType = config.selectorWeakMap as any;

    for (const observer of subs) {
      const paths = config.proxyWeakMap?.get(observer)?.paths;

      if (paths != null) {
        const selectors: SelectorMethodType[] = [];
        for (const path of paths) {
          selectors.push((value) => {
            let _value = value;
            for (const branch of path) {
              if (!isValidObject(_value, true)) break;
              _value = _value[branch];
            }
            return _value;
          });
        }
        selectorWeakMap.set(observer, { selectors });
      }
    }

    this.selectorsWeakMap = selectorWeakMap;
  }
}

export type SubscriptionContainerKeyType = string | number;

export interface SubscriptionContainerConfigInterface {
  /**
   * Key/Name identifier of Subscription Container
   * @default undefined
   */
  key?: SubscriptionContainerKeyType;
  /**
   * A keymap with a 2 dimensional arrays representing paths/routes to particular properties in the State at key.
   * The subscriptionContainer will then only rerender the Component, when a property at a given path changes.
   * Not anymore if anything in the State object mutates, although it might not even be displayed in the Component.
   * For example:
   * {
   *   myState1: {paths: [['data', 'name']]},
   *   myState2: {paths: [['car', 'speed']]}
   * }
   * Now the subscriptionContain will only trigger a rerender on the Component
   * if 'data.name' in myState1 or 'car.speed' in myState2 changes.
   * If, for instance, 'data.age' in myState1 mutates it won't trigger a rerender,
   * since 'data.age' isn't represented in the proxyKeyMap.
   *
   * These particular paths can be tracked with the ProxyTree.
   * https://github.com/agile-ts/agile/tree/master/packages/proxytree
   *
   * @default {}
   */
  proxyWeakMap?: ProxyWeakMapType;
  /**
   * TODO
   * @default undefined
   */
  selectorWeakMap?: SelectorWeakMapType;
}

export type ProxyWeakMapType = WeakMap<Observer, { paths: string[][] }>;

export type SelectorWeakMapType<T = any> = WeakMap<
  Observer,
  { selectors: SelectorMethodType<T>[] }
>;
export type SelectorMethodType<T = any> = (value: T) => any;
