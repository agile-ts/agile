import {
  defineConfig,
  generateId,
  notEqual,
  Observer,
} from '../../../internal';

export class SubscriptionContainer {
  public key?: SubscriptionContainerKeyType;
  public ready = false;
  public subs: Set<Observer>; // Observers that are Subscribed to this SubscriptionContainer (Component)

  // Represents the paths to the accessed properties of the State/s this SubscriptionContainer represents
  public proxyKeyMap: ProxyKeyMapInterface;
  public proxyBased = false;

  // For Object based Subscription
  public isObjectBased = false;
  public observerKeysToUpdate: Array<string> = []; // Holds temporary keys of Observers that got updated (Note: keys based on 'subsObject')
  public subsObject?: { [key: string]: Observer }; // Same as subs but in Object shape

  /**
   * @internal
   * SubscriptionContainer - Represents Component/(Way to rerender Component) that is subscribed by Observer/s (Agile)
   * -> Used to cause rerender on Component
   * @param subs - Initial Subscriptions
   * @param config - Config
   */
  constructor(
    subs: Array<Observer> = [],
    config: SubscriptionContainerConfigInterface = {}
  ) {
    config = defineConfig(config, {
      proxyKeyMap: {},
      key: generateId(),
    });

    this.subs = new Set(subs);
    this.key = config.key;
    this.proxyKeyMap = config.proxyKeyMap as any;
    this.proxyBased = notEqual(this.proxyKeyMap, {});
  }
}

export type SubscriptionContainerKeyType = string | number;

/**
 * @param proxyKeyMap - A keymap with a 2 dimensional arrays with paths/routes to particular properties in the State at key.
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
 * @param key - Key/Name of Subscription Container
 */
export interface SubscriptionContainerConfigInterface {
  proxyKeyMap?: ProxyKeyMapInterface;
  key?: SubscriptionContainerKeyType;
}

export interface ProxyKeyMapInterface {
  [key: string]: { paths: string[][] };
}
