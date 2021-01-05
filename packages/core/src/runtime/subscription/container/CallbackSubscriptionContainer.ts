import {
  Observer,
  SubscriptionContainer,
  SubscriptionContainerKeyType,
} from '../../../internal';

export class CallbackSubscriptionContainer extends SubscriptionContainer {
  public callback: Function;

  /**
   * @internal
   * CallbackSubscriptionContainer - Subscription Container for Callback based Subscriptions
   * @param callback - Callback Function that causes rerender on Component that is subscribed by Agile
   * @param subs - Initial Subscriptions
   * @param key - Key/Name of Callback Subscription Container
   */
  constructor(
    callback: Function,
    subs: Array<Observer> = [],
    key?: SubscriptionContainerKeyType,
  ) {
    super(subs, key);
    this.callback = callback;
  }
}
