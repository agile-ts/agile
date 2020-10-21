import { Observer, SubscriptionContainer } from "../../../internal";

export class CallbackSubscriptionContainer extends SubscriptionContainer {
  public callback: Function;

  /**
   * @internal
   * CallbackSubscriptionContainer - Subscription Container for Callback based Subscriptions
   * @param callback - Callback Function that causes rerender on Component that is subscribed by Agile
   * @param subs - Initial Subscriptions
   */
  constructor(callback: Function, subs?: Set<Observer>) {
    super(subs);
    this.callback = callback;
  }
}
