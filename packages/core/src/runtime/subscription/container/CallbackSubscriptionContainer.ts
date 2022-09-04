import {
  SubscriptionContainer,
  SubscriptionContainerConfigInterface,
} from './SubscriptionContainer';
import type { Observer } from '../../observer';

export class CallbackSubscriptionContainer extends SubscriptionContainer {
  /**
   * Callback function to trigger a re-render
   * on the UI-Component which is represented by the Subscription Container.
   */
  public callback: Function;

  /**
   * A Callback Subscription Container represents a UI-Component in AgileTs
   * and triggers re-renders on the UI-Component via the specified callback function.
   *
   * The Callback Subscription Container doesn't keep track of the Component itself.
   * It only knows how to trigger re-renders on it by calling the callback function.
   *
   * [Learn more..](https://agile-ts.org/docs/core/integration#callback-based)
   *
   * @internal
   * @param callback - Callback function to cause a rerender on the Component
   * to be represented by the Subscription Container.
   * @param subs - Observers to be initial subscribed to the Subscription Container.
   * @param config - Configuration object
   */
  constructor(
    callback: Function,
    subs: Array<Observer> | { [key: string]: Observer },
    config: SubscriptionContainerConfigInterface = {}
  ) {
    super(subs, config);
    this.callback = callback;
  }
}
