import {
  Observer,
  SubscriptionContainer,
  SubscriptionContainerConfigInterface,
} from '../../../internal';

export class ComponentSubscriptionContainer<
  C = any
> extends SubscriptionContainer {
  /**
   * Component the Subscription Container represents.
   */
  public component: C;

  /**
   * Subscription Container for component based subscriptions.
   *
   * In a component based subscription, a rerender is triggered on the Component via muting a local
   * State Management instance of the Component.
   * For example in a React Class Component the `this.state` property.
   *
   * The Component Subscription Container keeps track of the Component itself,
   * in order to synchronize the Component State Management instance with the subscribed Observer values.
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
