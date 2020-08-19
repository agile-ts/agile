import {State} from "./state";
import Agile from "./agile";
import {copy} from "./utils";
import {CallbackContainer, SubscriptionContainer} from "./sub";

export interface JobInterface {
    state: State
    newStateValue?: any
    background?: boolean
}

export interface JobConfigInterface {
    perform?: boolean
    background?: boolean
}

export default class Runtime {
    public agileInstance: Agile;

    private currentJob: JobInterface | null = null;
    private jobQueue: Array<JobInterface> = [];
    private jobsToRerender: Array<JobInterface> = [];

    // public foundState: Set<State> = new Set();

    constructor(agileInstance: Agile) {
        this.agileInstance = agileInstance;
    }


    //=========================================================================================================
    // Ingest
    //=========================================================================================================
    /**
     * @internal
     * Creates a Job out of State and new Value and than add it to a job queue
     */
    public ingest(state: State, newStateValue?: any, options: JobConfigInterface = {perform: true}): void {
        const job: JobInterface = {
            state: state,
            newStateValue: newStateValue,
            background: options?.background
        };

        // If the argument at the position 1 -> newState is undefined than take the next State
        // Have to do it so because you can also set the StateValue to undefined but there I don't want to take the nextState value
        if (arguments[1] === undefined)
            job.newStateValue = job.state.nextState

        // Push the Job to the Queue (safety.. that no Job get forgotten)
        this.jobQueue.push(job);

        // Perform the Job
        if (options?.perform) {
            const performJob = this.jobQueue.shift();
            if (performJob)
                this.perform(performJob);
            console.warn("Agile: Failed to perform Job ", job)
        }
    }


    //=========================================================================================================
    // Perform
    //=========================================================================================================
    /**
     * @internal
     * Perform a State Update
     */
    private perform(job: JobInterface): void {
        // Set Job to current
        this.currentJob = job;

        // Set Previous State
        job.state.previousState = copy(job.state._masterValue);

        // Write new value into the State
        job.state.privateWrite(job.newStateValue);

        // Perform SideEffects like watcher functions
        this.sideEffects(job.state);

        // Set Job as completed (The deps and subs of completed jobs will be updated)
        if (!job.background)
            this.jobsToRerender.push(job);

        // Reset Current Job
        this.currentJob = null;

        // Logging
        if (this.agileInstance.config.logJobs)
            console.log(`Agile: Completed Job(${job.state.name})`, job);

        // Continue the Loop and perform the next job.. if no job is left update the Subscribers for each completed job
        if (this.jobQueue.length > 0) {
            const performJob = this.jobQueue.shift();
            if (performJob)
                this.perform(performJob);
            else
                console.warn("Agile: Failed to perform Job ", job);
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

        // Call State SideEffects
        // this should not be used on root state class as it would be overwritten by extentions
        // this is used mainly to cause group to generate its output after changing
        if (typeof state.sideEffects === 'function')
            state.sideEffects();

        // Ingest Dependencies of State (Perform is false because it will be performed anyway after this sideEffect)
        state.dep.deps.forEach((state) => this.ingest(state, undefined, {perform: false}));
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
        // It won't happen anything because the state has no subs.. but this check here will maybe improve the performance
        if (!this.agileInstance.integration) {
            this.jobsToRerender = [];
            return;
        }

        // Subscriptions that has to be updated
        const subscriptionsToUpdate: Set<SubscriptionContainer> = new Set<SubscriptionContainer>();

        // Map through Jobs to Rerender
        this.jobsToRerender.forEach(job =>
            // Map through subs of the current Job State
            job.state.dep.subs.forEach(subscriptionContainer => {
                // Check if subscriptionContainer is ready
                if (!subscriptionContainer.ready)
                    console.warn("Agile: SubscriptionContainer isn't ready yet ", subscriptionContainer);

                // For a Container that require props to be passed
                if (subscriptionContainer.passProps) {
                    let localKey: string | null = null;

                    // Find the local Key for this update by comparing the State instance from this Job to the State instances in the propStates object
                    for (let key in subscriptionContainer.propStates)
                        if (subscriptionContainer.propStates[key] === job.state)
                            localKey = key;

                    // If matching key is found push it into the SubscriptionContainer propKeysChanged where it later will be build to an changed prop object
                    if (localKey)
                        subscriptionContainer.propKeysChanged.push(localKey);
                }
                subscriptionsToUpdate.add(subscriptionContainer);
            }));

        // Perform Component or Callback updates
        // TODO maybe add a unique key to a component and if its the same don't cause a rerender for both -> performance optimization
        subscriptionsToUpdate.forEach(subscriptionContainer => {
            // If Callback based subscription call the Callback Function
            if (subscriptionContainer instanceof CallbackContainer) {
                subscriptionContainer.callback();
                return;
            }

            // If Component based subscription call the updateMethod which every framework has to define
            if (this.agileInstance.integration?.updateMethod)
                this.agileInstance.integration?.updateMethod(subscriptionContainer.component, this.formatChangedPropKeys(subscriptionContainer));
            else
                console.warn("Agile: The framework which you are using doesn't provide an updateMethod so it might be possible that no rerender will be triggered");
        });

        // Log Job
        if (this.agileInstance.config.logJobs && subscriptionsToUpdate.size > 0)
            console.log("Agile: Rerendered Components ", subscriptionsToUpdate);

        // Reset Jobs to Rerender
        this.jobsToRerender = [];
    }


    //=========================================================================================================
    // Format Changed Prop Keys
    //=========================================================================================================
    /**
     * @internal
     * Builds an object out of propKeysChanged in the SubscriptionContainer
     */
    public formatChangedPropKeys(subscriptionContainer: SubscriptionContainer): { [key: string]: any } {
        const finalObject: { [key: string]: any } = {};

        // Build Object
        subscriptionContainer.propKeysChanged.forEach(changedKey => {
            if (subscriptionContainer.propStates)
                finalObject[changedKey] = subscriptionContainer.propStates[changedKey].value;
        });

        return finalObject;
    }
}
