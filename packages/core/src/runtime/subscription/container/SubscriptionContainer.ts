import { Observer } from "../../../internal";

export class SubscriptionContainer {
  public ready: boolean = false;
  public subs: Set<Observer> = new Set<Observer>([]); // Observers that are Subscribed to this SubscriptionContainer (Component)

  // For Object based subscriptions
  public isObjectBased: boolean = false;
  public objectKeysChanged: Array<string> = []; // Holds temporary changed Object Keys (Runtime)
  public subsObject?: { [key: string]: Observer }; // Same as subs but in Object form

  /**
   * @internal
   * SubscriptionContainer - Represents Component/(Way to rerender Component) that is subscribed by Observer/s (Agile)
   * -> Used to cause rerender on subscribed Component
   * @param subs - Initial Subscriptions
   */
  constructor(subs?: Set<Observer>) {
    if (subs) this.subs = subs;
  }
}
