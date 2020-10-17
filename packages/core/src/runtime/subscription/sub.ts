import {
  Agile,
  Observer,
  StateObserver,
  SubscriptionContainer,
  ComponentSubscriptionContainer,
  CallbackSubscriptionContainer,
} from "../../internal";

export class SubController {
  public agileInstance: () => Agile;

  public componentSubs: Set<ComponentSubscriptionContainer> = new Set();
  public callbackSubs: Set<CallbackSubscriptionContainer> = new Set();

  /**
   * @internal
   * SubController - Handles subscriptions to a Component
   * @param {Agile} agileInstance - An instance of Agile
   */
  public constructor(agileInstance: Agile) {
    this.agileInstance = () => agileInstance;
  }

  //=========================================================================================================
  // Subscribe with Subs Object
  //=========================================================================================================
  /**
   * @internal
   * Subscribe to Agile with Object shaped subs
   * @param {any} integrationInstance - IntegrationInstance -> CallbackFunction or Component
   * @param subs - Initial subs in Object shape
   */
  public subscribeWithSubsObject(
    integrationInstance: any,
    subs: { [key: string]: Observer } = {}
  ): {
    subscriptionContainer: SubscriptionContainer;
    props: { [key: string]: Observer["value"] };
  } {
    const props: { [key: string]: Observer } = {};

    // Register Subscription -> decide weather subscriptionInstance is callback or component based
    const subscriptionContainer = this.registerSubscription(
      integrationInstance
    );

    // Set SubscriptionContainer to Object based
    subscriptionContainer.isObjectBased = true;
    subscriptionContainer.subsObject = subs;

    // Loop through initial subs and instantiate them
    Object.keys(subs).forEach((key) => {
      const observable = subs[key];

      // Add State to SubscriptionContainer Subs
      subscriptionContainer.subs.add(observable);

      // Add SubscriptionContainer to Observer Subs
      observable.dep.subscribe(subscriptionContainer);

      // Add Value to props if Observer has value
      if (observable.value) props[key] = observable.value;
    });

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
   * Subscribe to Agile with Array shaped subs
   * @param {any} integrationInstance - IntegrationInstance -> CallbackFunction or Component
   * @param {Array<Observer>} subs - Initial subs in Array shape
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

    // Loop through initial subs and instantiate them
    subs.forEach((observable) => {
      // Add State to SubscriptionContainer Subs
      subscriptionContainer.subs.add(observable);

      // Add SubscriptionContainer to State Subs
      observable.dep.subscribe(subscriptionContainer);
    });

    return subscriptionContainer;
  }

  //=========================================================================================================
  // Unsubscribe
  //=========================================================================================================
  /**
   * @internal
   * Unsubscribe callbackSubscriptionInstance or componentSubscriptionInstance
   * @param {any} subscriptionInstance - SubscriptionInstance -> SubscriptionContainer or Component which holds an SubscriptionContainer
   */
  public unsubscribe(subscriptionInstance: any) {
    // Helper function to unsubscribe callback or component based subscription
    const unsub = (subscriptionContainer: SubscriptionContainer) => {
      subscriptionContainer.ready = false;

      // Removes SubscriptionContainer from Observer subs
      subscriptionContainer.subs.forEach((state) => {
        state.dep.unsubscribe(subscriptionContainer);
      });
    };

    // Unsubscribe callback based Subscription
    if (subscriptionInstance instanceof CallbackSubscriptionContainer)
      unsub(subscriptionInstance);

    // Unsubscribe component based Subscription
    // Check if component/class has property componentSubscriptionContainer, which should hold an instance of ComponentSubscriptionContainer
    if (subscriptionInstance.componentSubscriptionContainer)
      unsub(
        subscriptionInstance.componentSubscriptionContainer as ComponentSubscriptionContainer
      );
  }

  //=========================================================================================================
  // Register Subscription
  //=========================================================================================================
  /**
   * @internal
   * Registers Component or Callback Subscription
   * @param {any} integrationInstance - IntegrationInstance -> CallbackFunction or Component
   * @param {Array<Observer>} subs - Initial subs in Array shape
   */
  public registerSubscription(
    integrationInstance: any,
    subs: Array<Observer> = []
  ): SubscriptionContainer {
    if (typeof integrationInstance === "function")
      return this.registerCallbackSubscription(integrationInstance, subs);

    return this.registerComponentSubscription(integrationInstance, subs);
  }

  //=========================================================================================================
  // Register Component Subscription
  //=========================================================================================================
  /**
   * Registers Component Subscription
   * Note: Helper Function
   */
  private registerComponentSubscription(
    componentInstance: any,
    subs: Array<Observer> = []
  ): ComponentSubscriptionContainer {
    // Create ComponentSubscriptionContainer
    const componentContainer = new ComponentSubscriptionContainer(
      componentInstance,
      new Set(subs)
    );

    // Create an instance of the componentSubscriptionContainer in the Component.. to be able to unsubscribe it later (see unsubscribe)
    if (componentInstance.componentSubscriptionContainer)
      componentInstance.componentSubscriptionContainer = componentContainer;

    // Add to components
    this.componentSubs.add(componentContainer);

    // Set Ready
    if (!this.agileInstance().config.waitForMount)
      componentContainer.ready = true;

    if (this.agileInstance().config.logJobs)
      console.log("Agile: Registered Component ", componentContainer);

    return componentContainer;
  }

  //=========================================================================================================
  // Register Callback Subscription
  //=========================================================================================================
  /**
   * Registers Callback Subscription
   * Note: Helper Function
   */
  private registerCallbackSubscription(
    callbackFunction: () => void,
    subs: Array<Observer> = []
  ): CallbackSubscriptionContainer {
    // Create CallbackSubscriptionContainer
    const callbackContainer = new CallbackSubscriptionContainer(
      callbackFunction as Function,
      new Set(subs)
    );

    // Add to callbacks
    this.callbackSubs.add(callbackContainer);

    // Set Ready
    callbackContainer.ready = true;

    if (this.agileInstance().config.logJobs)
      console.log("Agile: Registered Callback ", callbackContainer);

    return callbackContainer;
  }

  //=========================================================================================================
  // Mount
  //=========================================================================================================
  /**
   * This will mount the component (Mounts currently only useful in Component based Subscription)
   */
  public mount(integrationInstance: any) {
    if (!integrationInstance.componentContainer) return;
    integrationInstance.componentContainer.ready = true;
  }
}
