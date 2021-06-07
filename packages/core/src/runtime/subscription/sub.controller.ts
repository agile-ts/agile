import {
  Agile,
  Observer,
  SubscriptionContainer,
  ComponentSubscriptionContainer,
  CallbackSubscriptionContainer,
  isFunction,
  SubscriptionContainerConfigInterface,
  defineConfig,
  removeProperties,
  LogCodeManager,
} from '../../internal';

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
   * Manages the subscription to UI-Components.
   *
   * @internal
   * @param agileInstance - Instance of Agile the Subscription Container belongs to.
   */
  public constructor(agileInstance: Agile) {
    this.agileInstance = () => agileInstance;
  }

  /**
   * Creates a so called Subscription Container which represents an UI-Component in AgileTs.
   * Such Subscription Container know how to trigger a rerender on the UI-Component it represents
   * through the provided `integrationInstance`.
   *
   * There exist two different ways on how the Subscription Container can cause a rerender on the Component.
   * - 1. Via a callback function that directly triggers a rerender on the Component. (Callback based Subscription)
   * [Learn more..](https://agile-ts.org/docs/core/integration/#callback-based)
   * - 2. Via the Component instance itself.
   * For example by mutating a local State Management property. (Component based Subscription)
   * [Learn more..](https://agile-ts.org/docs/core/integration/#component-based)
   *
   * The in an object specified Observers are then automatically subscribed
   * to the created Subscription Container and thus to the Component the Subscription Container represents.
   *
   * The advantage of subscribing the Observer via a object keymap,
   * is that each Observer has its own unique key identifier.
   * Such key identifier is for example required when merging the Observer value into
   * a local Component State Management property.
   * ```
   * this.state = {...this.state, {state1: Observer1.value, state2: Observer2.value}}
   * ```
   *
   * @internal
   * @param integrationInstance - Callback function or Component Instance for triggering a rerender on a UI-Component.
   * @param subs - Observers to be subscribed to the Subscription Container.
   * @param config - Configuration object
   */
  public subscribeWithSubsObject(
    integrationInstance: any,
    subs: { [key: string]: Observer } = {},
    config: RegisterSubscriptionConfigInterface = {}
  ): {
    subscriptionContainer: SubscriptionContainer;
    props: { [key: string]: Observer['value'] };
  } {
    const props: { [key: string]: Observer['value'] } = {};

    // Create Subscription Container
    const subscriptionContainer = this.createSubscriptionContainer(
      integrationInstance,
      config
    );

    // Set SubscriptionContainer to object based
    // and assign property keys to the 'subscriberKeysWeakMap'
    subscriptionContainer.isObjectBased = true;
    for (const key in subs)
      subscriptionContainer.subscriberKeysWeakMap.set(subs[key], key);

    // Subscribe Observers to the created Subscription Container
    // and build a Observer value keymap
    for (const key in subs) {
      const observer = subs[key];
      observer.subscribe(subscriptionContainer);
      if (observer.value) props[key] = observer.value;
    }

    return {
      subscriptionContainer: subscriptionContainer,
      props: props,
    };
  }

  /**
   * Creates a so called Subscription Container which represents an UI-Component in AgileTs.
   * Such Subscription Container know how to trigger a rerender on the UI-Component it represents
   * through the provided `integrationInstance`.
   *
   * There exist two different ways on how the Subscription Container can cause a rerender on the Component.
   * - 1. Via a callback function that directly triggers a rerender on the Component. (Callback based Subscription)
   * [Learn more..](https://agile-ts.org/docs/core/integration/#callback-based)
   * - 2. Via the Component instance itself.
   * For example by mutating a local State Management property. (Component based Subscription)
   * [Learn more..](https://agile-ts.org/docs/core/integration/#component-based)
   *
   * The in an array specified Observers are then automatically subscribed
   * to the created Subscription Container and thus to the Component the Subscription Container represents.
   *
   * @internal
   * @param integrationInstance - Callback function or Component Instance for triggering a rerender on a UI-Component.
   * @param subs - Observers to be subscribed to the Subscription Container.
   * @param config - Configuration object
   */
  public subscribeWithSubsArray(
    integrationInstance: any,
    subs: Array<Observer> = [],
    config: RegisterSubscriptionConfigInterface = {}
  ): SubscriptionContainer {
    // Create Subscription Container
    const subscriptionContainer = this.createSubscriptionContainer(
      integrationInstance,
      config
    );

    // Subscribe Observers to the created Subscription Container
    subs.forEach((observer) => observer.subscribe(subscriptionContainer));

    return subscriptionContainer;
  }

  /**
   * Unsubscribe the Subscription Container extracted from the specified 'subscriptionInstance'
   * from all Observers that were subscribed to it.
   *
   * We should always unsubscribe a Subscription Container when it isn't in use anymore,
   * for example when the Component it represented has been unmounted.
   *
   * @internal
   * @param subscriptionInstance - Subscription Container
   * or an UI-Component that contains an instance of the Subscription Container to be unsubscribed.
   */
  public unsubscribe(subscriptionInstance: any) {
    // Helper function to remove Subscription Container from Observer
    const unsub = (subscriptionContainer: SubscriptionContainer) => {
      subscriptionContainer.ready = false;
      subscriptionContainer.subscribers.forEach((observer) => {
        observer.unsubscribe(subscriptionContainer);
      });
    };

    // Unsubscribe callback based Subscription Container
    if (subscriptionInstance instanceof CallbackSubscriptionContainer) {
      unsub(subscriptionInstance);
      this.callbackSubs.delete(subscriptionInstance);

      Agile.logger.if
        .tag(['runtime', 'subscription'])
        .info(LogCodeManager.getLog('15:01:00'), subscriptionInstance);
      return;
    }

    // Unsubscribe component based Subscription Container
    if (subscriptionInstance instanceof ComponentSubscriptionContainer) {
      unsub(subscriptionInstance);
      this.componentSubs.delete(subscriptionInstance);

      Agile.logger.if
        .tag(['runtime', 'subscription'])
        .info(LogCodeManager.getLog('15:01:01'), subscriptionInstance);
      return;
    }

    // Unsubscribe component based Subscription Container extracted from the 'componentSubscriptionContainers' property
    if (
      subscriptionInstance['componentSubscriptionContainers'] !== null &&
      Array.isArray(subscriptionInstance.componentSubscriptionContainers)
    ) {
      subscriptionInstance.componentSubscriptionContainers.forEach(
        (subContainer) => {
          unsub(subContainer as ComponentSubscriptionContainer);
          this.componentSubs.delete(subContainer);

          Agile.logger.if
            .tag(['runtime', 'subscription'])
            .info(LogCodeManager.getLog('15:01:01'), subscriptionInstance);
        }
      );
      return;
    }
  }

  /**
   * Returns a Component or Callback based Subscription Container
   * based on the specified `integrationInstance`.
   *
   * @internal
   * @param integrationInstance - Callback function or Component Instance for triggering a rerender on a UI-Component.
   * @param config - Configuration object
   */
  public createSubscriptionContainer(
    integrationInstance: any,
    config: RegisterSubscriptionConfigInterface = {}
  ): SubscriptionContainer {
    config = defineConfig(config, {
      waitForMount: this.agileInstance().config.waitForMount,
    });
    return isFunction(integrationInstance)
      ? this.createCallbackSubscriptionContainer(integrationInstance, config)
      : this.createComponentSubscriptionContainer(integrationInstance, config);
  }

  //=========================================================================================================
  // Create Component Subscription Container
  //=========================================================================================================
  /**
   * Returns a newly created Component based Subscription Container.
   *
   * Registers Component based Subscription and applies SubscriptionContainer to Component.
   * If an instance called 'subscriptionContainers' exists in Component it will push the new SubscriptionContainer to this Array,
   * otherwise it creates a new Instance called 'subscriptionContainer' which holds the new  SubscriptionContainer
   *
   * @internal
   * @param componentInstance - Component Instance for triggering a rerender on a UI-Component.
   * @param config - Configuration object.
   */
  public createComponentSubscriptionContainer(
    componentInstance: any,
    config: RegisterSubscriptionConfigInterface = {}
  ): ComponentSubscriptionContainer {
    const componentSubscriptionContainer = new ComponentSubscriptionContainer(
      componentInstance,
      [],
      removeProperties(config, ['waitForMount'])
    );
    this.componentSubs.add(componentSubscriptionContainer);

    // Define ready state of Subscription Container
    if (config.waitForMount) {
      if (this.mountedComponents.has(componentInstance))
        componentSubscriptionContainer.ready = true;
    } else componentSubscriptionContainer.ready = true;

    // Add subscriptionContainer to Component, to have an instance of it there
    // (Required to unsubscribe the Subscription Container later via the Component Instance)
    if (
      componentInstance.componentSubscriptionContainers &&
      Array.isArray(componentInstance.componentSubscriptionContainers)
    )
      componentInstance.componentSubscriptionContainers.push(
        componentSubscriptionContainer
      );
    else
      componentInstance.componentSubscriptionContainers = [
        componentSubscriptionContainer,
      ];

    Agile.logger.if
      .tag(['runtime', 'subscription'])
      .info(LogCodeManager.getLog('15:01:02'), componentSubscriptionContainer);

    return componentSubscriptionContainer;
  }

  /**
   * Returns a newly created Callback based Subscription Container.
   *
   * @internal
   * @param callbackFunction - Callback function for triggering a rerender on a UI-Component.
   * @param config - Configuration object
   */
  public createCallbackSubscriptionContainer(
    callbackFunction: () => void,
    config: RegisterSubscriptionConfigInterface = {}
  ): CallbackSubscriptionContainer {
    const callbackSubscriptionContainer = new CallbackSubscriptionContainer(
      callbackFunction,
      [],
      removeProperties(config, ['waitForMount'])
    );
    this.callbackSubs.add(callbackSubscriptionContainer);
    callbackSubscriptionContainer.ready = true;

    Agile.logger.if
      .tag(['runtime', 'subscription'])
      .info(LogCodeManager.getLog('15:01:03'), callbackSubscriptionContainer);

    return callbackSubscriptionContainer;
  }

  /**
   * Mounts Component based Subscription Container.
   *
   * @internal
   * @param componentInstance - SubscriptionContainer(Component) that gets mounted
   */
  public mount(componentInstance: any) {
    if (
      componentInstance.componentSubscriptionContainers &&
      Array.isArray(componentInstance.componentSubscriptionContainers)
    )
      componentInstance.componentSubscriptionContainers.map(
        (c) => (c.ready = true)
      );

    this.mountedComponents.add(componentInstance);
  }

  /**
   * Unmounts Component based Subscription Containers.
   *
   * @internal
   * @param componentInstance - SubscriptionContainer(Component) that gets unmounted
   */
  public unmount(componentInstance: any) {
    if (
      componentInstance.componentSubscriptionContainers &&
      Array.isArray(componentInstance.componentSubscriptionContainers)
    )
      componentInstance.componentSubscriptionContainers.map(
        (c) => (c.ready = false)
      );

    this.mountedComponents.delete(componentInstance);
  }
}

interface RegisterSubscriptionConfigInterface
  extends SubscriptionContainerConfigInterface {
  /**
   * Whether the Subscription Container should only become ready
   * when the Component has been mounted.
   * @default agileInstance.config.waitForMount
   */
  waitForMount?: boolean;
}
