import {State} from "./state";
import Agile from "./agile";
import {copy} from "./utils";
import {CallbackContainer, SubscriptionContainer} from "./sub";

export interface Job {
    state: State
    newStateValue?: any
}

export default class Runtime {
    public agileInstance: Agile;

    private current: Job | null = null;
    private queue: Array<Job> = [];
    private completed: Array<Job> = [];

    // public foundState: Set<State> = new Set();

    constructor(agileInstance: Agile) {
        this.agileInstance = agileInstance;
    }


    //=========================================================================================================
    // Ingest
    //=========================================================================================================
    /**
     * @internal
     * Creates a Job out of the State and the new Value and add it to a queue
     */
    public ingest(state: State, newStateValue?: any, perform: boolean = true): void {
        let job: Job = {state, newStateValue};

        // If the argument at the position 1 -> newState is undefined than take the next State
        // Have to do it so because you can also set the StateValue to undefined but there I don't want to take the nextState value
        if (arguments[1] === undefined)
            job.newStateValue = job.state.nextState

        // Push the Job to the Queue (safety.. that no Job get forgotten)
        this.queue.push(job);

        // Perform the Job
        if (perform) {
            const performJob = this.queue.shift();
            if (performJob)
                this.perform(performJob);
        }
    }


    //=========================================================================================================
    // Perform
    //=========================================================================================================
    /**
     * @internal
     * Perform a State Update
     */
    private perform(job: Job): void {
        // Set Current to Job
        this.current = job;

        // Set Previous State
        job.state.previousState = copy(job.state._masterValue);

        // Write new value into the State
        job.state.privateWrite(job.newStateValue);

        // Perform SideEffects like watcher functions
        this.sideEffects(job.state);

        // Set Job as completed
        this.completed.push(job);

        // Reset Current property
        this.current = null;

        // Logging
        if (this.agileInstance.config.logJobs)
            console.log(`Agile: Completed Job(${job.state.name})`, job);

        // Continue the Loop and perform the next job.. if no job is left update the Subscribers for each completed job
        if (this.queue.length > 0) {
            const performJob = this.queue.shift();
            if (performJob)
                this.perform(performJob);
        } else {
            // https://stackoverflow.com/questions/9083594/call-settimeout-without-delay
            setTimeout(() => {
                // Cause rerender on Subscribers
                this.updateSubscribers();
            })
        }
    }


    //=========================================================================================================
    // Side Effect
    //=========================================================================================================
    /**
     * @internal
     * SideEffects are sideEffects of the perform function.. for instance the watchers
     */
    private sideEffects(state: State) {
        // Call Watchers
        for (let watcher in state.watchers)
            if (typeof state.watchers[watcher] === 'function')
                state.watchers[watcher](state.getPublicValue());

        // Ingest Dependencies of State
        state.dep.deps.forEach((state) => this.ingest(state, undefined));
    }


    //=========================================================================================================
    // Update Subscribers
    //=========================================================================================================
    /**
     * @internal
     * This will be update all Subscribers of complete jobs
     */
    private updateSubscribers(): void {
        // Check if Agile has an integration because its useless to go trough this process without framework
        // It won't happen anything because the state has no subs.. but this check here will maybe improve the performance by many states
        if (!this.agileInstance.integration) {
            this.completed = [];
            return;
        }

        // Components that has to be updated
        const componentsToUpdate: Set<SubscriptionContainer> = new Set<SubscriptionContainer>();

        // Map through completed Jobs
        this.completed.forEach(job =>
            // Map through subs of the current Job
            job.state.dep.subs.forEach(subscriptionContainer => {
                // For a Container that require props to be passed
                if (subscriptionContainer.passProps) {
                    let localKey: string | null = null;

                    // Find the local Key for this update by comparing the State instance from this Job to the State instances in the mappedStates object
                    for (let key in subscriptionContainer.propStates)
                        if (subscriptionContainer.propStates[key] === job.state)
                            localKey = key;

                    // If matching key is found push it into the SubscriptionContainer
                    if (localKey)
                        subscriptionContainer.propKeysChanged.push(localKey);
                }
                componentsToUpdate.add(subscriptionContainer);
            }));

        // Perform Component or Callback updates
        componentsToUpdate.forEach(subscriptionContainer => {
            // If Callback based subscription call the Callback Function
            if (subscriptionContainer instanceof CallbackContainer) {
                subscriptionContainer.callback();
                return;
            }

            // If Component based subscription call the updateMethod which every framework has to define
            if (this.agileInstance.integration?.updateMethod)
                this.agileInstance.integration?.updateMethod(subscriptionContainer.component, Runtime.formatChangedPropKeys(subscriptionContainer));
            else
                console.warn("Agile: The framework which you are using doesn't provide an updateMethod so it might be possible that no rerender will be triggered")
        });

        // Log Job
        if (this.agileInstance.config.logJobs && componentsToUpdate.size > 0)
            console.log("Agile: Rerendered Components ", componentsToUpdate);

        // Reset completed Jobs
        this.completed = [];
    }


    //=========================================================================================================
    // Format Changed Keys
    //=========================================================================================================
    /**
     * @internal
     * Builds an object out of propKeysChanged in the SubscriptionContainer
     */
    static formatChangedPropKeys(subscriptionContainer: SubscriptionContainer): { [key: string]: any } {
        const finalObject: { [key: string]: any } = {};

        // Build Object
        subscriptionContainer.propKeysChanged.forEach(changedKey => {
            if (subscriptionContainer.propStates)
                finalObject[changedKey] = subscriptionContainer.propStates[changedKey].value;
        });

        return finalObject;
    }
}
