import {
  Observer,
  SubscriptionContainer,
  SubscriptionContainerConfigInterface,
} from '../../../internal';

export class ComponentSubscriptionContainer<
  C = any
> extends SubscriptionContainer {
  /**
   * Component the Subscription Container represents
   * and mutates to cause rerender on it.
   */
  public component: C;

  /**
   * Subscription Container for component based subscriptions.
   *
   * In a component based subscription, a rerender is triggered on the Component
   * by muting a local State Management instance/property of the Component.
   * For example in a React Class Component the `this.state` property.
   *
   * The Component Subscription Container keeps track of the Component itself,
   * to synchronize the Component State Management instance with the subscribed Observer values.
   *
   * For this to work well, a component subscription is often object based
   * so that each observer has a uniq key.
   * ```
   * // Object based (guaranteed unique key)
   * {
   *   state1: Observer,
   *   state2: Observer
   * }
   *
   * // Array based (no guaranteed unique key)
   * [Observer, Observer]
   * ```
   *
   * [Learn more..](https://agile-ts.org/docs/core/integration#component-based)
   *
   * @internal
   * @param component - Component to be represent by the Subscription Container.
   * @param subs - Observers to be subscribed to the Subscription Container.
   * @param config - Configuration object
   */
  constructor(
    component: C,
    subs: Array<Observer> = [],
    config: SubscriptionContainerConfigInterface = {}
  ) {
    super(subs, config);
    this.component = component;
  }
}
