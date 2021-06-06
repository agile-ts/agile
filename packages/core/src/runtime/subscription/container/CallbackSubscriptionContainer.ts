import {
  Observer,
  SubscriptionContainer,
  SubscriptionContainerConfigInterface,
} from '../../../internal';

export class CallbackSubscriptionContainer extends SubscriptionContainer {
  /**
   * Callback function to trigger a rerender
   * on the Component the Subscription Container represents.
   */
  public callback: Function;

  /**
   * Subscription Container for callback based subscriptions.
   *
   * In a callback based subscription, a rerender is triggered on the Component via a specified callback function.
   *
   * The Callback Subscription Container doesn't keep track of the Component itself.
   * It only knows how to trigger a rerender on the particular Component through the callback function.
   *
   * [Learn more..](https://agile-ts.org/docs/core/integration#callback-based)
   *
   * @internal
   * @param callback - Callback function to cause a rerender on the Component
   * to be represented by the Subscription Container.
   * @param subs - Observers to be subscribed to the Subscription Container.
   * @param config - Configuration object
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
