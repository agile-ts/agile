import {
  Observer,
  SubscriptionContainer,
  SubscriptionContainerConfigInterface,
} from '../../../internal';

export class ComponentSubscriptionContainer extends SubscriptionContainer {
  public component: any;

  /**
   * @internal
   * ComponentSubscriptionContainer - SubscriptionContainer for Component based Subscription
   * @param component - Component that is subscribed by Agile
   * @param  subs - Initial Subscriptions
   * @param config - Config
   */
  constructor(
    component: any,
    subs: Array<Observer> = [],
    config: SubscriptionContainerConfigInterface = {}
  ) {
    super(subs, config);
    this.component = component;
  }
}
