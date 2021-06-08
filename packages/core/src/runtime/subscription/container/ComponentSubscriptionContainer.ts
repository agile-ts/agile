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
   * A Component Subscription Container represents a UI-Component in AgileTs
   * and triggers a rerender on the UI-Component by muting the specified Component Instance.
   * For example by updating a local State Management property of the Component.
   * (like in a React Class Components the `this.state` property)
   *
   * The Component Subscription Container keeps track of the Component itself,
   * to mutate it accordingly so that a rerender is triggered.
   *
   * For this to work well, a Component Subscription Container is often object based.
   * Meaning that each Observer was provided in a object keymap with a unique key identifier.
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
   * Thus the Integrations 'updateMethod' method can be called
   * with an complete object of changed Observer values.
   * ```
   * updateMethod: (componentInstance, updatedData) => {
   *  console.log(componentInstance); // Returns [this.component]
   *  console.log(updatedData); // Returns changed Observer values (see below)
   *  // {
   *  //   state1: Observer.value,
   *  //   state2: Observer.value
   *  // }
   *  }
   * ```
   *
   * [Learn more..](https://agile-ts.org/docs/core/integration#component-based)
   *
   * @internal
   * @param component - Component to be represented by the Subscription Container
   * and mutated via the Integration method 'updateMethod()' to trigger rerender on it.
   * @param subs - Observers to be subscribed to the Subscription Container.
   * @param config - Configuration object
   */
  constructor(
    component: C,
    subs: Array<Observer> | { [key: string]: Observer },
    config: SubscriptionContainerConfigInterface = {}
  ) {
    super(subs, config);
    this.component = component;
  }
}
