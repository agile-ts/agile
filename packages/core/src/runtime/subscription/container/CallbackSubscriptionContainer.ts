import {
  Observer,
  SubscriptionContainer,
  SubscriptionContainerConfigInterface,
} from '../../../internal';

export class CallbackSubscriptionContainer extends SubscriptionContainer {
  public callback: Function;

  /**
   * @internal
   * CallbackSubscriptionContainer - Subscription Container for Callback based Subscriptions
   * @param callback - Callback Function that causes rerender on Component that is subscribed by Agile
   * @param subs - Initial Subscriptions
   * @param config - Config
   */
  constructor(
    callback: Function,
    subs: Array<Observer> = [],
    config: SubscriptionContainerConfigInterface = {}
  ) {
    super(subs, config);
    this.callback = callback;
  }
}
