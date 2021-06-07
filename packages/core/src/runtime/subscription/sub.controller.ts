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
   * Creates a so called Subscription Container which represents an UI-Component in AgileTs.
   * Such Subscription Container know how to trigger a rerender on the UI-Component it represents
   * through the provided 'integrationInstance'.
   *
   * There exist two different ways on how the Subscription Container can cause a rerender on the Component.
   * - 1. Via a callback function that triggers a rerender on the Component. (Callback based Subscription)
   * [Learn more..](https://agile-ts.org/docs/core/integration/#callback-based)
   * - 2. Via the Component instance itself.
   * For example by mutating a local State Management property
   * of the Component Instance. (Component based Subscription)
   * [Learn more..](https://agile-ts.org/docs/core/integration/#component-based)
   *
   * The in an object specified Observers are then automatically subscribed
   * to the created Subscription Container and thus to the Component the Subscription Container represents.
   *
   * The advantage of subscribing the Observer via a object keymap,
   * is that each Observer has its own unique key identifier.
   * Such key can for example required when merging the Observer value at key into
   * a local Component State Management property.
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

    // Create a rerender interface to Component
    // via the specified 'integrationInstance' (Subscription Container)
    const subscriptionContainer = this.registerSubscription(
      integrationInstance,
      subsArray,
      config
    );

    // Set SubscriptionContainer to object based
    // and assign property keys to the 'subscriberKeysWeakMap'
    subscriptionContainer.isObjectBased = true;
    for (const key in subs)
      subscriptionContainer.subscriberKeysWeakMap.set(subs[key], key);

    // Subscribe Observer to the created Subscription Container and build props object
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
   * through the provided 'integrationInstance'.
   *
   * There exist two different ways on how the Subscription Container can cause a rerender on the Component.
   * - 1. Via a callback function that triggers a rerender on the Component. (Callback based Subscription)
   * [Learn more..](https://agile-ts.org/docs/core/integration/#callback-based)
   * - 2. Via the Component instance itself.
   * For example by mutating a local State Management property
   * of the Component Instance. (Component based Subscription)
   * [Learn more..](https://agile-ts.org/docs/core/integration/#component-based)
   *
   * The in an array specified Observers are then automatically subscribed
   * to the created Subscription Container and thus to the Component the Subscription Container represents.
   *
   * @internal
   * @param integrationInstance - Callback function or Component Instance for triggering a rerender on a UI-Component.
   * @param subs - Observers to be subscribed to the Subscription Container in array shape.
   * @param config - Configuration object
   */
  public subscribeWithSubsArray(
    integrationInstance: any,
    subs: Array<Observer> = [],
    config: RegisterSubscriptionConfigInterface = {}
  ): SubscriptionContainer {
    // Create a rerender interface to Component
    // via the specified 'integrationInstance' (Subscription Container)
    const subscriptionContainer = this.registerSubscription(
      integrationInstance,
      subs,
      config
    );

    // Subscribe Observer to the created Subscription Container
    subs.forEach((observer) => observer.subscribe(subscriptionContainer));

    return subscriptionContainer;
  }

  /**
   * Unsubscribe the from the specified 'subscriptionInstance'
   * extracted SubscriptionContainer from all Observers that
   * are subscribed to it.
   *
   * @internal
   * @param subscriptionInstance - Subscription Container
   * or an UI-Component holding a instance of a Subscription Container
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
    return isFunction(integrationInstance)
      ? this.registerCallbackSubscription(integrationInstance, subs, config)
      : this.registerComponentSubscription(integrationInstance, subs, config);
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
