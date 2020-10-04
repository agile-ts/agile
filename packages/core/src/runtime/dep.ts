import {
    SubscriptionContainer
} from '../internal';
import {Observer} from "./observer";

export class Dep {
    public deps: Set<Observer> = new Set(); // Dependencies from the State
    public subs: Set<SubscriptionContainer> = new Set(); // Subscriptions (for instance a component subscribes to a state to get rerendered if the state changes)

    constructor(initialDeps?: Array<Observer>) {
        if (!initialDeps) return;

        // Add Initial Dependencies to Deps
        initialDeps.forEach(observable => this.deps.add(observable));
    }


    //=========================================================================================================
    // Depend
    //=========================================================================================================
    /**
     * Add new Dependency to the State
     */
    public depend(observable: Observer) {
        if (observable.dep !== this && !this.deps.has(observable))
            this.deps.add(observable);
    }


    //=========================================================================================================
    // Subscribe
    //=========================================================================================================
    /**
     * Add new Subscription to the State
     */
    public subscribe(subscriptionContainer: SubscriptionContainer){
        if(!this.subs.has(subscriptionContainer))
            this.subs.add(subscriptionContainer);
    }


    //=========================================================================================================
    // Unsubscribe
    //=========================================================================================================
    /**
     * Delete Subscription from the State
     */
    public unsubscribe(subscriptionContainer: SubscriptionContainer){
        if(!this.subs.has(subscriptionContainer))
            this.subs.delete(subscriptionContainer);
    }
}
