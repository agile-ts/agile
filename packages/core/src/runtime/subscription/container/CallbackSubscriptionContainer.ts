import { Observer, SubscriptionContainer } from "../../../internal";

export class CallbackSubscriptionContainer extends SubscriptionContainer {
  public callback: Function;

  /**
   * @internal
   * CallbackSubscriptionContainer - Callback based Subscription
   * @param {Function} callback - Callback Function which causes a rerender on the Component which is subscribed by Agile
   * @param {Set<Observer>} subs - Initial Subscriptions of the Subscription Container
   */
  constructor(callback: Function, subs?: Set<Observer>) {
    super(subs);
    this.callback = callback;
  }
}
