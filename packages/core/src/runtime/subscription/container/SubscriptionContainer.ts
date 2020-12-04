import { Observer } from "../../../internal";

export class SubscriptionContainer {
  public key?: SubscriptionContainerKeyType;
  public ready: boolean = false;
  public subs: Set<Observer> = new Set<Observer>([]); // Observers that are Subscribed to this SubscriptionContainer (Component)

  // For Object based Subscription
  public isObjectBased = false;
  public changedObjectKeys: Array<string> = []; // Holds temporary changed Object Keys (Runtime)
  public subsObject?: { [key: string]: Observer }; // Same as subs but in Object form

  /**
   * @internal
   * SubscriptionContainer - Represents Component/(Way to rerender Component) that is subscribed by Observer/s (Agile)
   * -> Used to cause rerender on Component
   * @param subs - Initial Subscriptions
   * @param key - Key/Name of Subscription Container
   */
  constructor(subs?: Set<Observer>, key?: SubscriptionContainerKeyType) {
    if (subs) this.subs = subs;
    this.key = key;
  }
}

export type SubscriptionContainerKeyType = string | number;
