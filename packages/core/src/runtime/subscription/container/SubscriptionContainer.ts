import { Observer } from '../../../internal';

export class SubscriptionContainer {
  public key?: SubscriptionContainerKeyType;
  public ready = false;
  public subs: Set<Observer>; // Observers that are Subscribed to this SubscriptionContainer (Component)

  // For Object based Subscription
  public isObjectBased = false;
  public observerKeysToUpdate: Array<string> = []; // Holds temporary keys of Observers that got updated (Note: keys based on 'subsObject')
  public subsObject?: { [key: string]: Observer }; // Same as subs but in Object shape

  /**
   * @internal
   * SubscriptionContainer - Represents Component/(Way to rerender Component) that is subscribed by Observer/s (Agile)
   * -> Used to cause rerender on Component
   * @param subs - Initial Subscriptions
   * @param key - Key/Name of Subscription Container
   */
  constructor(subs: Array<Observer> = [], key?: SubscriptionContainerKeyType) {
    this.subs = new Set(subs);
    this.key = key;
  }
}

export type SubscriptionContainerKeyType = string | number;
