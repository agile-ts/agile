import {SubscriptionContainer} from '../sub';
import {State} from "./index";

export default class Dep {
    // static
    public deps: Set<any> = new Set(); // Dependencies of a State
    public subs: Set<SubscriptionContainer> = new Set(); // Subscriptions of a State (In a render Component) (Set by integrations)

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
        if (state.dep !== this)
            this.deps.add(state);
    }
}
