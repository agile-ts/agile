import {Agile, Observer} from '../../internal';
import {ComponentSubscriptionContainer} from "./ComponentSubscriptionContainer";
import {CallbackSubscriptionContainer} from "./CallbackSubscriptionContainer";



//=========================================================================================================
// Subscription Container
//=========================================================================================================

export type SubscriptionContainer = ComponentSubscriptionContainer | CallbackSubscriptionContainer;


//=========================================================================================================
// Controller
//=========================================================================================================

export class SubController {
    public agileInstance: () => Agile;

    // Component based Subscription
    public components: Set<ComponentSubscriptionContainer> = new Set();

    // Callback based Subscription
    public callbacks: Set<CallbackSubscriptionContainer> = new Set();

    public constructor(agileInstance: Agile) {
        this.agileInstance = () => agileInstance;
    }


    //=========================================================================================================
    // Subscribe with Subs Object
    //=========================================================================================================
    /**
     * Subscribe to Agile State with a returned object of props this props can than be returned by the component (See react-integration)
     */
    public subscribeWithSubsObject(subscriptionInstance: any, subs: { [key: string]: Observer } = {}): { subscriptionContainer: SubscriptionContainer, props: { [key: string]: Observer['value'] } } {
        const subscriptionContainer = this.registerSubscription(subscriptionInstance);

        const props: { [key: string]: Observer } = {};
        subscriptionContainer.passProps = true;
        subscriptionContainer.propObservable = {...subs};

        // Go through subs
        let localKeys = Object.keys(subs);
        localKeys.forEach(key => {
            const observable = subs[key];

            // Add State to SubscriptionContainer Subs
            subscriptionContainer.subs.add(observable);

            // Add SubscriptionContainer to State Subs
            observable.dep.subscribe(subscriptionContainer);

            // Add state to props
            props[key] = observable.value;
        });

        return {
            subscriptionContainer: subscriptionContainer,
            props: props
        };
    }


    //=========================================================================================================
    // Subscribe with Subs Array
    //=========================================================================================================
    /**
     * Subscribe to Agile State
     */
    public subscribeWithSubsArray(subscriptionInstance: any, subs: Array<Observer> = []): SubscriptionContainer {
        const subscriptionContainer = this.registerSubscription(subscriptionInstance, subs);

        subs.forEach(observable => {
            // Add State to SubscriptionContainer Subs
            subscriptionContainer.subs.add(observable);

            // Add SubscriptionContainer to State Dependencies Subs
            observable.dep.subscribe(subscriptionContainer);
        });

        return subscriptionContainer;
    }


    //=========================================================================================================
    // Unsubscribe
    //=========================================================================================================
    /**
     * Unsubscribe a component or callback
     */
    public unsubscribe(subscriptionInstance: any) {
        const unsub = (subscriptionContainer: SubscriptionContainer) => {
            subscriptionContainer.ready = false;

            // Removes SubscriptionContainer from State subs
            subscriptionContainer.subs.forEach(state => {
                state.dep.unsubscribe(subscriptionContainer);
            });
        };

        // Check if subscriptionInstance is CallbackSubscriptionContainer
        if (subscriptionInstance instanceof CallbackSubscriptionContainer)
            unsub(subscriptionInstance);

        // Check if subscriptionInstance has componentSubscriptionContainer.. which holds an instance of a ComponentSubscriptionContainer
        if (subscriptionInstance.componentSubscriptionContainer)
            unsub(subscriptionInstance.componentSubscriptionContainer as ComponentSubscriptionContainer);
    }


    //=========================================================================================================
    // Register Subscription
    //=========================================================================================================
    /**
     * Registers the Component/Callback Subscription and returns a SubscriptionContainer
     */
    public registerSubscription(integrationInstance: any, subs: Array<Observer> = []): SubscriptionContainer {
        if (typeof integrationInstance === 'function')
            return this.registerCallbackSubscription(integrationInstance, subs);

        return this.registerComponentSubscription(integrationInstance, subs);
    }


    //=========================================================================================================
    // Mount
    //=========================================================================================================
    /**
     * This will mount the component (Mounts currently only useful in Component based Subscription)
     */
    public mount(integrationInstance: any) {
        if (!integrationInstance.componentContainer) return;

        // Set Ready to true
        integrationInstance.componentContainer.ready = true;
    }


    //=========================================================================================================
    // Register Component Subscription
    //=========================================================================================================
    /**
     * Registers Component Subscription
     * Note: Helper Function
     */
    private registerComponentSubscription(componentInstance: any, subs: Array<Observer> = []): ComponentSubscriptionContainer {
        // Create ComponentSubscriptionContainer
        const componentContainer = new ComponentSubscriptionContainer(componentInstance, new Set(subs));

        // Create an instance of the componentSubscriptionContainer in the Component.. to be able to unsubscribe it later (see unsubscribe)
        if (componentInstance.componentSubscriptionContainer)
            componentInstance.componentSubscriptionContainer = componentContainer;

        // Add to components
        this.components.add(componentContainer);

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
    private registerCallbackSubscription(callbackFunction: () => void, subs: Array<Observer> = []): CallbackSubscriptionContainer {
        // Create CallbackSubscriptionContainer
        const callbackContainer = new CallbackSubscriptionContainer(callbackFunction as Function, new Set(subs));

        // Add to callbacks
        this.callbacks.add(callbackContainer);

        // Set Ready
        callbackContainer.ready = true;

        if (this.agileInstance().config.logJobs)
            console.log("Agile: Registered Callback ", callbackContainer);

        return callbackContainer;
    }
}
