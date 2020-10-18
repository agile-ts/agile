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

  public componentSubs: Set<ComponentSubscriptionContainer> = new Set(); // Holds all registered ComponentSubscriptionContainers
  public callbackSubs: Set<CallbackSubscriptionContainer> = new Set(); // Holds all registered CallbackSubscriptionContainers

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
   * @param subs - Initial subs Object
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

    // Instantiate subs
    for (let key in subs) {
      const observable = subs[key];

      // Add State to SubscriptionContainer Subs
      subscriptionContainer.subs.add(observable);

      // Add SubscriptionContainer to Observer Subs
      observable.subscribe(subscriptionContainer);

      // Add Value to props if Observer has value
      if (observable.value) props[key] = observable.value;
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
   * Subscribe to Agile with Array shaped subs
   * @param {any} integrationInstance - IntegrationInstance -> CallbackFunction or Component
   * @param {Array<Observer>} subs - Initial subs Array
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

    // Instantiate subs
    subs.forEach((observable) => {
      // Add State to SubscriptionContainer Subs
      subscriptionContainer.subs.add(observable);

      // Add SubscriptionContainer to State Subs
      observable.subscribe(subscriptionContainer);
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
        state.unsubscribe(subscriptionContainer);
      });
    };

    // Unsubscribe callback based Subscription
    if (subscriptionInstance instanceof CallbackSubscriptionContainer)
      unsub(subscriptionInstance);

    // Unsubscribe component based Subscription
    // Check if component/class has property componentSubscriptionContainer, which holds an instance of ComponentSubscriptionContainer
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
   * @param {any} componentInstance - Component which has subscribed an Observer
   * @param {Array<Observer>} subs - Initial subs Array
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

    // To have an instance of a SubscriptionContainer in the Component (for instance needed to unsubscribe component later)
    if (componentInstance.componentSubscriptionContainer)
      componentInstance.componentSubscriptionContainer = componentSubscriptionContainer;

    // Set to ready if not waiting until component got mounted
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
   * @param {() => void} callbackFunction - CallbackFunction which causes a rerender on a component which has subscribed an Observer
   * @param {Array<Observer>} subs - Initial subs Array
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
   * Mounts a component
   * @param {any} componentInstance - Component which should get mounted
   */
  public mount(componentInstance: any) {
    if (!componentInstance.componentSubscriptionContainer) return;
    componentInstance.componentSubscriptionContainer.ready = true;
  }
}
