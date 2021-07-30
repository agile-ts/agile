import {
  SubscriptionContainer,
  SubscriptionContainerConfigInterface,
} from './SubscriptionContainer';
import { Observer } from '../../observer';

export class ComponentSubscriptionContainer<
  C = any
> extends SubscriptionContainer {
  /**
   * UI-Component which is represented by the Subscription Container
   * and mutated via the Integration's `updateMethod()` method
   * to cause re-renders on it.
   */
  public component: C;

  /**
   * A Component Subscription Container represents a UI-Component in AgileTs
   * and triggers re-renders on the UI-Component by muting the specified Component Instance
   * via the Integration's `updateMethod()` method.
   * For example by updating a local State Management property of the Component
   * (like in React Class Components the `this.state` property).
   *
   * The Component Subscription Container keeps track of the Component itself,
   * to mutate it appropriately so that re-renders can be triggered on it.
   *
   * For this to work well, a Component Subscription Container is often object based.
   * Meaning that each Observer was provided in an object keymap
   * with a unique key identifier.
   * ```
   * // Object based (guaranteed unique key identifier)
   * {
   *   state1: Observer,
   *   state2: Observer
   * }
   *
   * // Array based (no guaranteed unique key identifier)
   * [Observer, Observer]
   * ```
   * Thus the Integration's 'updateMethod()' method can be called
   * with a complete object of updated Observer values.
   * ```
   * updateMethod: (componentInstance, updatedData) => {
   *   console.log(componentInstance); // Returns 'this.component'
   *   console.log(updatedData); // Returns updated Observer values keymap (see below)
   *   // {
   *   //   state1: Observer.value,
   *   //   state2: Observer.value,
   *   // }
   *   }
   * ```
   *
   * [Learn more..](https://agile-ts.org/docs/core/integration#component-based)
   *
   * @internal
   * @param component - UI-Component to be represented by the Subscription Container
   * and mutated via the Integration's 'updateMethod()' method to trigger re-renders on it.
   * @param subs - Observers to be initial subscribed to the Subscription Container.
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
