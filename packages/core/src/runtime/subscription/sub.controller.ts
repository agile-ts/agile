import { defineConfig, isFunction, removeProperties } from '@agile-ts/utils';
import { logCodeManager } from '../../logCodeManager';
import { Agile } from '../../agile';
import {
  SubscriptionContainer,
  SubscriptionContainerConfigInterface,
} from './container/SubscriptionContainer';
import { ComponentSubscriptionContainer } from './container/ComponentSubscriptionContainer';
import { CallbackSubscriptionContainer } from './container/CallbackSubscriptionContainer';
import { Observer } from '../observer';

export class SubController {
  // Agile Instance the SubController belongs to
  public agileInstance: () => Agile;

  // Keeps track of all registered Component based Subscriptions
  public componentSubs: Set<ComponentSubscriptionContainer> = new Set();
  // Keeps track of all registered Callback based Subscriptions
  public callbackSubs: Set<CallbackSubscriptionContainer> = new Set();

  // Keeps track of all mounted Components (only if agileInstance.config.mount = true)
  public mountedComponents: Set<any> = new Set();

  /**
   * The Subscription Controller manages and simplifies the subscription to UI-Components.
   *
   * Thus it creates Subscription Containers (Interfaces to UI-Components)
   * and assigns them to the specified Observers.
   * These Observers can then easily trigger re-renders on UI-Components
   * via the created Subscription Containers.
   *
   * @internal
   * @param agileInstance - Instance of Agile the Subscription Controller belongs to.
   */
  public constructor(agileInstance: Agile) {
    this.agileInstance = () => agileInstance;
  }

  /**
   * Creates a so called Subscription Container that represents an UI-Component in AgileTs.
   * Such Subscription Container know how to trigger a re-render on the UI-Component it represents
   * through the provided `integrationInstance`.
   *
   * Currently, there are two different ways the Subscription Container can trigger a re-render on the UI-Component.
   * - 1. Via a callback function that directly triggers a rerender on the UI-Component.
   *   (= Callback based Subscription)
   *   [Learn more..](https://agile-ts.org/docs/core/integration/#callback-based)
   * - 2. Via the Component instance itself.
   *   For example by mutating a local State Management property.
   *   (= Component based Subscription)
   *   [Learn more..](https://agile-ts.org/docs/core/integration/#component-based)
   *
   * The in an array specified Observers are then automatically subscribed
   * to the created Subscription Container and thus to the UI-Component it represents.
   *
   * @public
   * @param integrationInstance - Callback function or Component Instance to trigger a rerender on a UI-Component.
   * @param subs - Observers to be subscribed to the to create Subscription Container.
   * @param config - Configuration object
   */
  public subscribe(
    integrationInstance: any,
    subs: Array<Observer>,
    config?: RegisterSubscriptionConfigInterface
  ): SubscriptionContainer;
  /**
   * Creates a so called Subscription Container that represents an UI-Component in AgileTs.
   * Such Subscription Container know how to trigger a re-render on the UI-Component it represents
   * through the provided `integrationInstance`.
   *
   * Currently, there are two different ways the Subscription Container can trigger a re-render on the UI-Component.
   * - 1. Via a callback function that directly triggers a rerender on the UI-Component.
   *   (= Callback based Subscription)
   *   [Learn more..](https://agile-ts.org/docs/core/integration/#callback-based)
   * - 2. Via the Component instance itself.
   *   For example by mutating a local State Management property.
   *   (= Component based Subscription)
   *   [Learn more..](https://agile-ts.org/docs/core/integration/#component-based)
   *
   * The in an object keymap specified Observers are then automatically subscribed
   * to the created Subscription Container and thus to the UI-Component it represents.
   *
   * The advantage of subscribing the Observer via a object keymap,
   * is that each Observer has its own unique 'external' key identifier.
   * Such key identifier is, for example, required when merging the Observer value into
   * a local UI-Component State Management property.
   * ```
   * this.state = {...this.state, {state1: Observer1.value, state2: Observer2.value}}
   * ```
   *
   * @public
   * @param integrationInstance - Callback function or Component Instance to trigger a rerender on a UI-Component.
   * @param subs - Observers to be subscribed to the to create Subscription Container.
   * @param config - Configuration object
   */
  public subscribe(
    integrationInstance: any,
    subs: { [key: string]: Observer },
    config?: RegisterSubscriptionConfigInterface
  ): {
    subscriptionContainer: SubscriptionContainer;
    props: { [key: string]: Observer['value'] };
  };
  public subscribe(
    integrationInstance: any,
    subs: { [key: string]: Observer } | Array<Observer>,
    config: RegisterSubscriptionConfigInterface = {}
  ):
    | SubscriptionContainer
    | {
        subscriptionContainer: SubscriptionContainer;
        props: { [key: string]: Observer['value'] };
      } {
    config = defineConfig(config, {
      waitForMount: this.agileInstance().config.waitForMount,
    });

    // Create Subscription Container based on specified 'integrationInstance'
    const subscriptionContainer = this[
      isFunction(integrationInstance)
        ? 'createCallbackSubscriptionContainer'
        : 'createComponentSubscriptionContainer'
    ](integrationInstance, subs, config);

    // Return object based Subscription Container and an Observer value keymap
    if (subscriptionContainer.isObjectBased && !Array.isArray(subs)) {
      const props: { [key: string]: Observer['value'] } = {};
      for (const key in subs) if (subs[key].value) props[key] = subs[key].value;
      return { subscriptionContainer, props };
    }

    // Return array based Subscription Container
    return subscriptionContainer;
  }

  /**
   * Removes the Subscription Container extracted from the specified 'subscriptionInstance'
   * from all Observers that were subscribed to it.
   *
   * We should always unregister a Subscription Container when it is no longer in use.
   * For example, when the UI-Component it represents has been unmounted.
   *
   * @public
   * @param subscriptionInstance - UI-Component that contains an instance of a Subscription Container
   * or a Subscription Container to be unsubscribed/unregistered.
   */
  public unsubscribe(subscriptionInstance: any) {
    // Helper function to remove Subscription Container from Observer
    const unsub = (subscriptionContainer: SubscriptionContainer) => {
      subscriptionContainer.ready = false;
      subscriptionContainer.subscribers.forEach((observer) => {
        subscriptionContainer.removeSubscription(observer);
      });
    };

    // Unsubscribe Callback based Subscription Container
    if (subscriptionInstance instanceof CallbackSubscriptionContainer) {
      unsub(subscriptionInstance);
      this.callbackSubs.delete(subscriptionInstance);
      logCodeManager.log(
        '15:01:00',
        { tags: ['subscription'] },
        subscriptionInstance
      );
      return;
    }

    // Unsubscribe Component based Subscription Container
    if (subscriptionInstance instanceof ComponentSubscriptionContainer) {
      unsub(subscriptionInstance);
      this.componentSubs.delete(subscriptionInstance);
      logCodeManager.log(
        '15:01:01',
        { tags: ['subscription'] },
        subscriptionInstance
      );
      return;
    }

    // Unsubscribe Component based Subscription Container
    // extracted from the 'componentSubscriptionContainers' property
    if (
      subscriptionInstance['componentSubscriptionContainers'] !== null &&
      Array.isArray(subscriptionInstance.componentSubscriptionContainers)
    ) {
      subscriptionInstance.componentSubscriptionContainers.forEach(
        (subContainer) => {
          unsub(subContainer as ComponentSubscriptionContainer);
          this.componentSubs.delete(subContainer);
          logCodeManager.log(
            '15:01:01',
            { tags: ['subscription'] },
            subscriptionInstance
          );
        }
      );
      return;
    }
  }

  /**
   * Returns a newly created Component based Subscription Container.
   *
   * @internal
   * @param componentInstance - UI-Component to be represented by the Subscription Container
   * and mutated via the Integration's 'updateMethod()' method to trigger re-renders on it.
   * @param subs - Observers to be initial subscribed to the Subscription Container.
   * @param config - Configuration object.
   */
  public createComponentSubscriptionContainer(
    componentInstance: any,
    subs: { [key: string]: Observer } | Array<Observer>,
    config: RegisterSubscriptionConfigInterface = {}
  ): ComponentSubscriptionContainer {
    const componentSubscriptionContainer = new ComponentSubscriptionContainer(
      componentInstance,
      subs,
      removeProperties(config, ['waitForMount'])
    );
    this.componentSubs.add(componentSubscriptionContainer);

    // Define ready state of Subscription Container
    if (config.waitForMount) {
      if (this.mountedComponents.has(componentInstance))
        componentSubscriptionContainer.ready = true;
    } else componentSubscriptionContainer.ready = true;

    // Add Subscription Container to the UI-Component it represents.
    // (For example, useful to unsubscribe the Subscription Container via the Component Instance)
    if (Array.isArray(componentInstance.componentSubscriptionContainers))
      componentInstance.componentSubscriptionContainers.push(
        componentSubscriptionContainer
      );
    else
      componentInstance['componentSubscriptionContainers'] = [
        componentSubscriptionContainer,
      ];

    logCodeManager.log(
      '15:01:02',
      { tags: ['subscription'] },
      componentSubscriptionContainer
    );

    return componentSubscriptionContainer;
  }

  /**
   * Returns a newly created Callback based Subscription Container.
   *
   * @internal
   * @param callbackFunction - Callback function to cause a rerender on the Component
   * to be represented by the Subscription Container.
   * @param subs - Observers to be initial subscribed to the Subscription Container.
   * @param config - Configuration object
   */
  public createCallbackSubscriptionContainer(
    callbackFunction: () => void,
    subs: { [key: string]: Observer } | Array<Observer>,
    config: RegisterSubscriptionConfigInterface = {}
  ): CallbackSubscriptionContainer {
    const callbackSubscriptionContainer = new CallbackSubscriptionContainer(
      callbackFunction,
      subs,
      removeProperties(config, ['waitForMount'])
    );
    this.callbackSubs.add(callbackSubscriptionContainer);
    callbackSubscriptionContainer.ready = true;

    logCodeManager.log(
      '15:01:03',
      { tags: ['subscription'] },
      callbackSubscriptionContainer
    );

    return callbackSubscriptionContainer;
  }

  /**
   * Notifies the Subscription Containers representing the specified UI-Component (`componentInstance`)
   * that the UI-Component they represent has been mounted.
   *
   * @public
   * @param componentInstance - Component Instance containing Subscription Containers to be mounted.
   */
  public mount(componentInstance: any) {
    if (
      componentInstance['componentSubscriptionContainers'] != null &&
      Array.isArray(componentInstance.componentSubscriptionContainers)
    )
      componentInstance.componentSubscriptionContainers.map(
        (c) => (c.ready = true)
      );

    this.mountedComponents.add(componentInstance);
  }

  /**
   * Notifies the Subscription Containers representing the specified UI-Component (`componentInstance`)
   * that the UI-Component they represent has been unmounted.
   *
   * @public
   * @param componentInstance - Component Instance containing Subscription Containers to be unmounted
   */
  public unmount(componentInstance: any) {
    if (
      componentInstance['componentSubscriptionContainers'] != null &&
      Array.isArray(componentInstance.componentSubscriptionContainers)
    )
      componentInstance.componentSubscriptionContainers.map(
        (c) => (c.ready = false)
      );

    this.mountedComponents.delete(componentInstance);
  }
}

export interface RegisterSubscriptionConfigInterface
  extends SubscriptionContainerConfigInterface {
  /**
   * Whether the Subscription Container shouldn't be ready
   * until the UI-Component it represents has been mounted.
   * @default agileInstance.config.waitForMount
   */
  waitForMount?: boolean;
}
