import { Observer } from "../../internal";

export class SubscriptionContainer {
  public ready: boolean = false;
  public subs: Set<Observer> = new Set<Observer>([]); // Observers that are Subscribed to this Subscription Container

  // For Object based subscriptions
  public passProps: boolean = false;
  public propKeysChanged: Array<string> = []; // Used to preserve local keys to update before update is performed, cleared every update
  public subsObject?: { [key: string]: Observer }; // Same as subs but in Object form

  constructor(subs?: Set<Observer>) {
    if (subs) this.subs = subs;
  }
}
