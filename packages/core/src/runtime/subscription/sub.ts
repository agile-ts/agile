import {
  Agile,
  Observer,
  SubscriptionContainer,
  ComponentSubscriptionContainer,
  CallbackSubscriptionContainer,
  isFunction,
} from "../../internal";

export class SubController {
  public agileInstance: () => Agile;

  public componentSubs: Set<ComponentSubscriptionContainer> = new Set(); // Holds all registered Component based Subscriptions
  public callbackSubs: Set<CallbackSubscriptionContainer> = new Set(); // Holds all registered Callback based Subscriptions

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
   */
  public subscribeWithSubsObject(
    integrationInstance: any,
    subs: { [key: string]: Observer } = {}
  ): {
    subscriptionContainer: SubscriptionContainer;
    props: { [key: string]: Observer["value"] };
  } {
    const props: { [key: string]: Observer } = {};

    // Create subsArray
    const subsArray: Observer[] = [];
    for (let key in subs) {
      subsArray.push(subs[key]);
    }

    // Register Subscription -> decide weather subscriptionInstance is callback or component based
    const subscriptionContainer = this.registerSubscription(
      integrationInstance,
      subsArray
    );

    // Set SubscriptionContainer to Object based
    subscriptionContainer.isObjectBased = true;
    subscriptionContainer.subsObject = subs;

    // Register subs
    for (let key in subs) {
      const observer = subs[key];

      // Add Observer to SubscriptionContainer Subs
      subscriptionContainer.subs.add(observer);

      // Add SubscriptionContainer to Observer Subs
      observer.subscribe(subscriptionContainer);

      // Add Value to props if Observer has value
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
   */
  public subscribeWithSubsArray(
    integrationInstance: any,
    subs: Array<Observer> = []
  ): SubscriptionContainer {
    // Register Subscription -> decide weather subscriptionInstance is callback or component based
    const subscriptionContainer = this.registerSubscription(
      integrationInstance,
      subs
    );

    // Register subs
    subs.forEach((observable) => {
      // Add Observer to SubscriptionContainer Subs
      subscriptionContainer.subs.add(observable);

      // Add SubscriptionContainer to Observer Subs
      observable.subscribe(subscriptionContainer);
    });

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
    // Helper function to unsubscribe callback or component based subscription
    const unsub = (subscriptionContainer: SubscriptionContainer) => {
      subscriptionContainer.ready = false;

      // Removes SubscriptionContainer from Observer subs
      subscriptionContainer.subs.forEach((observer) => {
        observer.unsubscribe(subscriptionContainer);
      });
    };

    // Unsubscribe callback based Subscription
    if (subscriptionInstance instanceof CallbackSubscriptionContainer) {
      unsub(subscriptionInstance);
      this.callbackSubs.delete(subscriptionInstance);

      // Logging
      if (this.agileInstance().config.logJobs)
        console.log(
          "Agile: Unregistered Callback based Subscription ",
          subscriptionInstance
        );
    }

    // Unsubscribe component based Subscription
    // Check if component/class has property componentSubscriptionContainer, which holds an instance of ComponentSubscriptionContainer
    if (subscriptionInstance.componentSubscriptionContainer) {
      unsub(
        subscriptionInstance.componentSubscriptionContainer as ComponentSubscriptionContainer
      );
      this.componentSubs.delete(subscriptionInstance);

      // Logging
      if (this.agileInstance().config.logJobs)
        console.log(
          "Agile: Unregistered Component based Subscription ",
          subscriptionInstance
        );
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
   */
  public registerSubscription(
    integrationInstance: any,
    subs: Array<Observer> = []
  ): SubscriptionContainer {
    if (isFunction(integrationInstance))
      return this.registerCallbackSubscription(integrationInstance, subs);
    return this.registerComponentSubscription(integrationInstance, subs);
  }

  //=========================================================================================================
  // Register Component Subscription
  //=========================================================================================================
  /**
   * @internal
   * Registers Component based Subscription
   * @param componentInstance - Component that got subscribed by Observer/s
   * @param subs - Initial Subscriptions
   */
  private registerComponentSubscription(
    componentInstance: any,
    subs: Array<Observer> = []
  ): ComponentSubscriptionContainer {
    const componentSubscriptionContainer = new ComponentSubscriptionContainer(
      componentInstance,
      new Set(subs)
    );
    this.componentSubs.add(componentSubscriptionContainer);

    // To have an instance of a SubscriptionContainer in the Component (needed to unsubscribe component later)
    if (componentInstance.componentSubscriptionContainer)
      componentInstance.componentSubscriptionContainer = componentSubscriptionContainer;

    // Set to ready if not waiting for component to mount
    if (!this.agileInstance().config.waitForMount)
      componentSubscriptionContainer.ready = true;

    // Logging
    if (this.agileInstance().config.logJobs)
      console.log(
        "Agile: Registered Component based Subscription ",
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
   */
  private registerCallbackSubscription(
    callbackFunction: () => void,
    subs: Array<Observer> = []
  ): CallbackSubscriptionContainer {
    const callbackSubscriptionContainer = new CallbackSubscriptionContainer(
      callbackFunction,
      new Set(subs)
    );
    this.callbackSubs.add(callbackSubscriptionContainer);
    callbackSubscriptionContainer.ready = true;

    // Logging
    if (this.agileInstance().config.logJobs)
      console.log(
        "Agile: Registered Callback based Subscription ",
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
    if (!componentInstance.componentSubscriptionContainer) return;
    componentInstance.componentSubscriptionContainer.ready = true;
  }
}
