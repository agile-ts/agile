import {
  Agile,
  Observer,
  SubscriptionContainer,
  ComponentSubscriptionContainer,
  CallbackSubscriptionContainer,
  isFunction,
  SubscriptionContainerKeyType,
} from '../../internal';

export class SubController {
  public agileInstance: () => Agile;

  public componentSubs: Set<ComponentSubscriptionContainer> = new Set(); // Holds all registered Component based Subscriptions
  public callbackSubs: Set<CallbackSubscriptionContainer> = new Set(); // Holds all registered Callback based Subscriptions

  public mountedComponents: Set<any> = new Set(); // Holds all mounted Components (only if agileInstance.config.mount = true)

  /**
   * @internal
   * SubController - Handles subscriptions to Components
   * @param agileInstance - An instance of Agile
   */
  public constructor(agileInstance: Agile) {
    this.agileInstance = () => agileInstance;
  }

  //=========================================================================================================
  // Subscribe with Subs Object
  //=========================================================================================================
  /**
   * @internal
   * Subscribe with Object shaped Subscriptions
   * @param integrationInstance - Callback Function or Component
   * @param subs - Initial Subscription Object
   * @param key - Key/Name of SubscriptionContainer
   */
  public subscribeWithSubsObject(
    integrationInstance: any,
    subs: { [key: string]: Observer } = {},
    key?: SubscriptionContainerKeyType
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
      key
    );

    // Set SubscriptionContainer to Object based
    subscriptionContainer.isObjectBased = true;
    subscriptionContainer.subsObject = subs;

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
   * @internal
   * Subscribe with Array shaped Subscriptions
   * @param integrationInstance - Callback Function or Component
   * @param subs - Initial Subscription Array
   * @param key - Key/Name of SubscriptionContainer
   */
  public subscribeWithSubsArray(
    integrationInstance: any,
    subs: Array<Observer> = [],
    key?: SubscriptionContainerKeyType
  ): SubscriptionContainer {
    // Register Subscription -> decide weather subscriptionInstance is callback or component based
    const subscriptionContainer = this.registerSubscription(
      integrationInstance,
      subs,
      key
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
      subscriptionContainer.subs.forEach((observer) => {
        observer.unsubscribe(subscriptionContainer);
      });
    };

    // Unsubscribe callback based Subscription
    if (subscriptionInstance instanceof CallbackSubscriptionContainer) {
      unsub(subscriptionInstance);
      this.callbackSubs.delete(subscriptionInstance);

      // Logging
      Agile.logger.if
        .tag(['core', 'subscription'])
        .info(
          'Unregistered Callback based Subscription ',
          subscriptionInstance
        );
      return;
    }

    // Unsubscribe component based Subscription
    if (subscriptionInstance instanceof ComponentSubscriptionContainer) {
      unsub(subscriptionInstance);
      this.componentSubs.delete(subscriptionInstance);

      // Logging
      Agile.logger.if
        .tag(['core', 'subscription'])
        .info(
          'Unregistered Component based Subscription ',
          subscriptionInstance
        );
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

      // Logging
      Agile.logger.if
        .tag(['core', 'subscription'])
        .info(
          'Unregistered Component based Subscription ',
          subscriptionInstance
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
   * @param key - Key/Name of SubscriptionContainer
   */
  public registerSubscription(
    integrationInstance: any,
    subs: Array<Observer> = [],
    key?: SubscriptionContainerKeyType
  ): SubscriptionContainer {
    if (isFunction(integrationInstance))
      return this.registerCallbackSubscription(integrationInstance, subs, key);
    return this.registerComponentSubscription(integrationInstance, subs, key);
  }

  //=========================================================================================================
  // Register Component Subscription
  //=========================================================================================================
  /**
   * @internal
   * Registers Component based Subscription
   * @param componentInstance - Component that got subscribed by Observer/s
   * @param subs - Initial Subscriptions
   * @param key - Key/Name of SubscriptionContainer
   */
  public registerComponentSubscription(
    componentInstance: any,
    subs: Array<Observer> = [],
    key?: SubscriptionContainerKeyType
  ): ComponentSubscriptionContainer {
    const componentSubscriptionContainer = new ComponentSubscriptionContainer(
      componentInstance,
      subs,
      key
    );
    this.componentSubs.add(componentSubscriptionContainer);

    // Set to ready if not waiting for component to mount
    if (this.agileInstance().config.waitForMount) {
      if (this.mountedComponents.has(componentInstance))
        componentSubscriptionContainer.ready = true;
    } else componentSubscriptionContainer.ready = true;

    // To have an instance of the SubscriptionContainer in the Component (necessary to unsubscribe component later)
    componentInstance.componentSubscriptionContainer = componentSubscriptionContainer;

    // Logging
    Agile.logger.if
      .tag(['core', 'subscription'])
      .info(
        'Registered Component based Subscription ',
        componentSubscriptionContainer
      );

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
   * @param key - Key/Name of SubscriptionContainer
   */
  public registerCallbackSubscription(
    callbackFunction: () => void,
    subs: Array<Observer> = [],
    key?: SubscriptionContainerKeyType
  ): CallbackSubscriptionContainer {
    const callbackSubscriptionContainer = new CallbackSubscriptionContainer(
      callbackFunction,
      subs,
      key
    );
    this.callbackSubs.add(callbackSubscriptionContainer);
    callbackSubscriptionContainer.ready = true;

    // Logging
    Agile.logger.if
      .tag(['core', 'subscription'])
      .info(
        'Registered Callback based Subscription ',
        callbackSubscriptionContainer
      );

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
