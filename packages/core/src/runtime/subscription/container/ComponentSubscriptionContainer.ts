import {
  Observer,
  SubscriptionContainer,
  SubscriptionContainerKeyType,
} from '../../../internal';

export class ComponentSubscriptionContainer extends SubscriptionContainer {
  public component: any;

  /**
   * @internal
   * ComponentSubscriptionContainer - SubscriptionContainer for Component based Subscription
   * @param component - Component that is subscribed by Agile
   * @param  subs - Initial Subscriptions
   * @param key - Key/Name of Component Subscription Container
   */
  constructor(
    component: any,
    subs: Array<Observer> = [],
    key?: SubscriptionContainerKeyType
  ) {
    super(subs, key);
    this.component = component;
  }
}
