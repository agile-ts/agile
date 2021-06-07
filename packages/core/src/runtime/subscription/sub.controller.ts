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
  // Agile Instance the Runtime belongs to
  public agileInstance: () => Agile;

  // Represents all registered Component based Subscriptions
  public componentSubs: Set<ComponentSubscriptionContainer> = new Set();
  // Represents all registered Callback based Subscriptions
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
   * Subscribes the in an object specified Observers to a Component represented by the 'integrationInstance'.
   * Such subscription ensures that the Observer is able to trigger rerenders on the Component
   * for example if its value changes.
   *
   * There are two ways of causing a rerender through the 'integrationInstance' on the Component.
   * - 1. Via a callback function which triggers a rerender
   * on the Component when it is called. (Callback based Subscription)
   * [Learn more..](https://agile-ts.org/docs/core/integration/#callback-based)
   * - 2. Via the Component itself.
   * For example by mutating the local State Management property
   * of the Component. (Component based Subscription)
   * [Learn more..](https://agile-ts.org/docs/core/integration/#component-based)
   *
   * The Component (way of rerendering the Component) is then represented by a created Subscription Container
   * that is added to the Observer and serves like an interface to the Component.
   *
   * @internal
   * @param integrationInstance - Callback function or Component Instance for triggering a rerender on a UI-Component.
   * @param subs - Observers to be subscribed to the Subscription Container in object shape.
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

    // Create subsArray
    const subsArray: Observer[] = [];
    for (const key in subs) subsArray.push(subs[key]);

    // Register Subscription -> decide weather subscriptionInstance is callback or component based
    const subscriptionContainer = this.registerSubscription(
      integrationInstance,
      subsArray,
      config
    );

    // Set SubscriptionContainer to Object based
    subscriptionContainer.isObjectBased = true;
    for (const key in subs)
      subscriptionContainer.subscriberKeysWeakMap.set(subs[key], key);

    // Register subs and build props object
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

  //=========================================================================================================
  // Subscribe with Subs Array
  //=========================================================================================================
  /**
   * Subscribe with Array shaped Subscriptions
   *
   *  @internal
   * @param integrationInstance - Callback function or Component Instance for triggering a rerender on a UI-Component.
   * @param subs - Observers to be subscribed to the Subscription Container in array shape.
   * @param config - Configuration object
   */
  public subscribeWithSubsArray(
    integrationInstance: any,
    subs: Array<Observer> = [],
    config: RegisterSubscriptionConfigInterface = {}
  ): SubscriptionContainer {
    // Register Subscription -> decide weather subscriptionInstance is callback or component based
    const subscriptionContainer = this.registerSubscription(
      integrationInstance,
      subs,
      config
    );

    // Register subs
    subs.forEach((observer) => observer.subscribe(subscriptionContainer));

    return subscriptionContainer;
  }

  //=========================================================================================================
  // Unsubscribe
  //=========================================================================================================
  /**
   * @internal
   * Unsubscribes SubscriptionContainer(Component)
   * @param subscriptionInstance - SubscriptionContainer or Component that holds an SubscriptionContainer
   */
  public unsubscribe(subscriptionInstance: any) {
    // Helper function to remove SubscriptionContainer from Observer
    const unsub = (subscriptionContainer: SubscriptionContainer) => {
      subscriptionContainer.ready = false;

      // Remove SubscriptionContainers from Observer
      subscriptionContainer.subscribers.forEach((observer) => {
        observer.unsubscribe(subscriptionContainer);
      });
    };

    // Unsubscribe callback based Subscription
    if (subscriptionInstance instanceof CallbackSubscriptionContainer) {
      unsub(subscriptionInstance);
      this.callbackSubs.delete(subscriptionInstance);

      Agile.logger.if
        .tag(['runtime', 'subscription'])
        .info(LogCodeManager.getLog('15:01:00'), subscriptionInstance);
      return;
    }

    // Unsubscribe component based Subscription
    if (subscriptionInstance instanceof ComponentSubscriptionContainer) {
      unsub(subscriptionInstance);
      this.componentSubs.delete(subscriptionInstance);

      Agile.logger.if
        .tag(['runtime', 'subscription'])
        .info(LogCodeManager.getLog('15:01:01'), subscriptionInstance);
      return;
    }

    // Unsubscribe component based Subscription with subscriptionInstance that holds a componentSubscriptionContainer
    if (subscriptionInstance.componentSubscriptionContainer) {
      unsub(
        subscriptionInstance.componentSubscriptionContainer as ComponentSubscriptionContainer
      );
      this.componentSubs.delete(
        subscriptionInstance.componentSubscriptionContainer
      );

      Agile.logger.if
        .tag(['runtime', 'subscription'])
        .info(LogCodeManager.getLog('15:01:01'), subscriptionInstance);
      return;
    }

    // Unsubscribe component based Subscription with subscriptionInstance that holds componentSubscriptionContainers
    if (
      subscriptionInstance.componentSubscriptionContainers &&
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

  //=========================================================================================================
  // Register Subscription
  //=========================================================================================================
  /**
   * @internal
   * Registers SubscriptionContainer and decides weather integrationInstance is a callback or component based Subscription
   * @param integrationInstance - Callback Function or Component
   * @param subs - Initial Subscriptions
   * @param config - Config
   */
  public registerSubscription(
    integrationInstance: any,
    subs: Array<Observer> = [],
    config: RegisterSubscriptionConfigInterface = {}
  ): SubscriptionContainer {
    config = defineConfig(config, {
      waitForMount: this.agileInstance().config.waitForMount,
    });
    if (isFunction(integrationInstance))
      return this.registerCallbackSubscription(
        integrationInstance,
        subs,
        config
      );
    return this.registerComponentSubscription(
      integrationInstance,
      subs,
      config
    );
  }

  //=========================================================================================================
  // Register Component Subscription
  //=========================================================================================================
  /**
   * @internal
   * Registers Component based Subscription and applies SubscriptionContainer to Component.
   * If an instance called 'subscriptionContainers' exists in Component it will push the new SubscriptionContainer to this Array,
   * otherwise it creates a new Instance called 'subscriptionContainer' which holds the new  SubscriptionContainer
   * @param componentInstance - Component that got subscribed by Observer/s
   * @param subs - Initial Subscriptions
   * @param config - Config
   */
  public registerComponentSubscription(
    componentInstance: any,
    subs: Array<Observer> = [],
    config: RegisterSubscriptionConfigInterface = {}
  ): ComponentSubscriptionContainer {
    const componentSubscriptionContainer = new ComponentSubscriptionContainer(
      componentInstance,
      subs,
      removeProperties(config, ['waitForMount'])
    );
    this.componentSubs.add(componentSubscriptionContainer);

    // Set to ready if not waiting for component to mount
    if (config.waitForMount) {
      if (this.mountedComponents.has(componentInstance))
        componentSubscriptionContainer.ready = true;
    } else componentSubscriptionContainer.ready = true;

    // Add subscriptionContainer to Component, to have an instance of it there (necessary to unsubscribe SubscriptionContainer later)
    if (
      componentInstance.componentSubscriptionContainers &&
      Array.isArray(componentInstance.componentSubscriptionContainers)
    )
      componentInstance.componentSubscriptionContainers.push(
        componentSubscriptionContainer
      );
    else
      componentInstance.componentSubscriptionContainer = componentSubscriptionContainer;

    Agile.logger.if
      .tag(['runtime', 'subscription'])
      .info(LogCodeManager.getLog('15:01:02'), componentSubscriptionContainer);

    return componentSubscriptionContainer;
  }

  //=========================================================================================================
  // Register Callback Subscription
  //=========================================================================================================
  /**
   * @internal
   * Registers Callback based Subscription
   * @param callbackFunction - Callback Function that causes rerender on Component which got subscribed by Observer/s
   * @param subs - Initial Subscriptions
   * @param config - Config
   */
  public registerCallbackSubscription(
    callbackFunction: () => void,
    subs: Array<Observer> = [],
    config: RegisterSubscriptionConfigInterface = {}
  ): CallbackSubscriptionContainer {
    const callbackSubscriptionContainer = new CallbackSubscriptionContainer(
      callbackFunction,
      subs,
      removeProperties(config, ['waitForMount'])
    );
    this.callbackSubs.add(callbackSubscriptionContainer);
    callbackSubscriptionContainer.ready = true;

    Agile.logger.if
      .tag(['runtime', 'subscription'])
      .info(LogCodeManager.getLog('15:01:03'), callbackSubscriptionContainer);

    return callbackSubscriptionContainer;
  }

  //=========================================================================================================
  // Mount
  //=========================================================================================================
  /**
   * @internal
   * Mounts Component based SubscriptionContainer
   * @param componentInstance - SubscriptionContainer(Component) that gets mounted
   */
  public mount(componentInstance: any) {
    if (componentInstance.componentSubscriptionContainer)
      componentInstance.componentSubscriptionContainer.ready = true;

    this.mountedComponents.add(componentInstance);
  }

  //=========================================================================================================
  // Unmount
  //=========================================================================================================
  /**
   * @internal
   * Unmounts Component based SubscriptionContainer
   * @param componentInstance - SubscriptionContainer(Component) that gets unmounted
   */
  public unmount(componentInstance: any) {
    if (componentInstance.componentSubscriptionContainer)
      componentInstance.componentSubscriptionContainer.ready = false;

    this.mountedComponents.delete(componentInstance);
  }
}

/**
 * @param waitForMount - Whether the subscriptionContainer should only become ready
 * when the Component has been mounted. (default = agileInstance.config.waitForMount)
 */
interface RegisterSubscriptionConfigInterface
  extends SubscriptionContainerConfigInterface {
  waitForMount?: boolean;
}
