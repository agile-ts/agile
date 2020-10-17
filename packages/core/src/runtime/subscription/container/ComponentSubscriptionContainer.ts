import { Observer, SubscriptionContainer } from "../../../internal";

export class ComponentSubscriptionContainer extends SubscriptionContainer {
  public component: any;

  /**
   * @internal
   * ComponentSubscriptionContainer - Component based Subscription
   * @param {any} component - Component which is subscribes Agile
   * @param {Set<Observer>} subs - Initial Subscriptions of the Subscription Container
   */
  constructor(component: any, subs?: Set<Observer>) {
    super(subs);
    this.component = component;
  }
}
