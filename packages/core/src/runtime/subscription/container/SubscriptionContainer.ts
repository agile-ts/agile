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

  // Represents the paths to the properties used in the Component of States
  public proxyKeyMap: ProxyMapInterface;
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
    const _config = defineConfig(config, {
      proxyKeymap: {},
      key: generateId(),
    });

    this.subs = new Set(subs);
    this.key = _config.key;
    this.proxyKeyMap = config.proxyKeyMap as any;
    this.proxyBased = notEqual(this.proxyKeyMap, {});
  }
}

export type SubscriptionContainerKeyType = string | number;

export interface SubscriptionContainerConfigInterface {
  proxyKeyMap?: ProxyMapInterface;
  key?: SubscriptionContainerKeyType;
}

export interface ProxyMapInterface {
  [key: string]: { paths: string[][] };
}
