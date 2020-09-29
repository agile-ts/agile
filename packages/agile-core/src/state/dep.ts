import {
    State,
    SubscriptionContainer
} from '../internal';

export class Dep {
    public deps: Set<any> = new Set(); // Dependencies from the State
    public subs: Set<SubscriptionContainer> = new Set(); // Subscriptions for instance a component subscribes to a state to get rerendered if the state changes

    constructor(initialDeps?: Array<Dep>) {
        if (!initialDeps) return;

        // Add Initial Dependencies to Deps
        initialDeps.forEach(dep => this.deps.add(dep));
    }


    //=========================================================================================================
    // Depend
    //=========================================================================================================
    /**
     * Add new State as dependency
     */
    public depend(state: State) {
        if (state.dep !== this && !this.deps.has(state))
            this.deps.add(state);
    }
}
