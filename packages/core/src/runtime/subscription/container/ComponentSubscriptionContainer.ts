import { Observer, SubscriptionContainer } from "../../../internal";

export class ComponentSubscriptionContainer extends SubscriptionContainer {
  public component: any;

  /**
   * @internal
   * ComponentSubscriptionContainer - SubscriptionContainer for Component based Subscription
   * @param component - Component that is subscribed by Agile
   * @param  subs - Initial Subscriptions
   */
  constructor(component: any, subs?: Set<Observer>) {
    super(subs);
    this.component = component;
  }
}
