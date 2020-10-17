import { Observer } from "../../../internal";

export class SubscriptionContainer {
  public ready: boolean = false;
  public subs: Set<Observer> = new Set<Observer>([]); // Observers that are Subscribed to this Subscription Container

  // For Object based subscriptions
  public isObjectBased: boolean = false;
  public objectKeysChanged: Array<string> = []; // Holds temporary changed Object Keys if it get performed in runtime
  public subsObject?: { [key: string]: Observer }; // Same as subs but in Object form to create later props out of it

  /**
   * @internal
   * SubscriptionContainer - Represents Components which are subscribed by Agile
   * @param {Set<Observer>} subs - Initial Subscriptions of the Subscription Container
   */
  constructor(subs?: Set<Observer>) {
    if (subs) this.subs = subs;
  }
}
