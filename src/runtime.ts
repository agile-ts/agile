import {State} from "./state";
import Agile from "./agile";
import {copy, defineConfig} from "./utils";
import {CallbackContainer, SubscriptionContainer} from "./sub";
import {Computed} from "./computed";

export interface JobInterface {
    state: State
    newStateValue?: any
    options?: {
        background?: boolean
        sideEffects?: boolean
        forceRerender?: boolean
    }
}

export interface JobConfigInterface {
    perform?: boolean // Should preform the job instantly
    background?: boolean // Shouldn't cause an rerender during the perform process
    sideEffects?: boolean // Should perform sideEffects like rebuilding groups
    forceRerender?: boolean // Force rerender although for instance the values are the same
}

export default class Runtime {
    public agileInstance: () => Agile;

    // Queue system
    private currentJob: JobInterface | null = null;
    private jobQueue: Array<JobInterface> = [];
    private jobsToRerender: Array<JobInterface> = [];

    // Used for tracking computed dependencies
    public trackState: boolean = false; // Check if agile should track states
    public foundStates: Set<State> = new Set(); // States which were tracked during the track time

    public internalIngestKey = "This is an Internal Key for ingesting internal stuff!";

    constructor(agileInstance: Agile) {
        this.agileInstance = () => agileInstance;
    }


    //=========================================================================================================
    // Ingest
    //=========================================================================================================
    /**
     * @internal
     * Creates a Job out of State and new Value and than add it to a job queue
     * Note: its not possible to set a state to undefined because undefined is used for internal activities!
     */
    public ingest(state: State, newStateValue?: any, options: JobConfigInterface = {}): void {
        // Merge default values into options
        options = defineConfig<JobConfigInterface>(options, {
            perform: true,
            background: false,
            sideEffects: true,
            forceRerender: false
        });

        // Create Job
        const job: JobInterface = {
            state: state,
            newStateValue: newStateValue,
            options: {
                background: options.background,
                sideEffects: options.sideEffects,
                forceRerender: options.forceRerender
            }
        };

        // Grab nextState if newState not passed or compute if needed
        if (newStateValue === this.internalIngestKey) {
            if (job.state instanceof Computed)
                job.newStateValue = job.state.computeValue();
            else
                job.newStateValue = job.state.nextState
        }

        // Check if state value und newStateValue are the same.. if so return except force Rerender (stringifying because of possible object or array)
        if (JSON.stringify(state.value) === JSON.stringify(job.newStateValue) && !options.forceRerender) {
            if (this.agileInstance().config.logJobs)
                console.warn("Agile: Doesn't perform job because state values are the same! ", job);
            return;
        }

        // Logging
        if (this.agileInstance().config.logJobs)
            console.log(`Agile: Created Job(${job.state.key})`, job);

        // Push the Job to the Queue (safety.. that no Job get forgotten)
        this.jobQueue.push(job);

        // Perform the Job
        if (options.perform) {
            const performJob = this.jobQueue.shift();
            if (performJob)
                this.perform(performJob);
            else
                console.warn("Agile: No Job in queue ", job)
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
        // Set Job to currentJob
        this.currentJob = job;

        // Set Previous State
        job.state.previousState = copy(job.state.value);

        // Write new value into the State
        job.state.privateWrite(job.newStateValue);

        // Set isSet
        job.state.isSet = job.newStateValue !== job.state.initialState;

        // Set is placeholder to false, because it has got a value
        if (job.state.isPlaceholder)
            job.state.isPlaceholder = false;

        // Perform SideEffects like watcher functions or state.sideEffects
        this.sideEffects(job);

        // Set Job as completed (The deps and subs of completed jobs will be updated)
        if (!job.options?.background || job.options?.forceRerender)
            this.jobsToRerender.push(job);

        // Reset Current Job
        this.currentJob = null;

        // Logging
        if (this.agileInstance().config.logJobs)
            console.log(`Agile: Completed Job(${job.state.key})`, job);

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
    private sideEffects(job: JobInterface) {
        const state = job.state;

        // Call Watchers
        for (let watcher in state.watchers)
            if (typeof state.watchers[watcher] === 'function')
                state.watchers[watcher](state.getPublicValue());

        // Call State SideEffects
        if (typeof state.sideEffects === 'function' && job.options?.sideEffects)
            state.sideEffects();

        // Ingest Dependencies of State (Perform is false because it will be performed anyway after this sideEffect)
        state.dep.deps.forEach((state) => this.ingest(state, this.internalIngestKey, {perform: false}));
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
        if (!this.agileInstance().integration) {
            this.jobsToRerender = [];
            return;
        }

        // Subscriptions that has to be updated (Set = For preventing double subscriptions without further checks)
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
        subscriptionsToUpdate.forEach(subscriptionContainer => {
            // If Callback based subscription call the Callback Function
            if (subscriptionContainer instanceof CallbackContainer) {
                subscriptionContainer.callback();
                return;
            }

            // If Component based subscription call the updateMethod which every framework has to define
            if (this.agileInstance().integration?.updateMethod)
                // @ts-ignore
                this.agileInstance().integration?.updateMethod(subscriptionContainer.component, this.formatChangedPropKeys(subscriptionContainer));
            else
                console.warn("Agile: The framework which you are using doesn't provide an updateMethod so it might be possible that no rerender will be triggered");
        });

        // Log Job
        if (this.agileInstance().config.logJobs && subscriptionsToUpdate.size > 0)
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


    //=========================================================================================================
    // Get Found State
    //=========================================================================================================
    /**
     * @internal
     * Will return all tracked States
     */
    public getFoundStates() {
        const finalFoundStates = this.foundStates;

        // Reset tracking
        this.trackState = false;
        this.foundStates = new Set();

        return finalFoundStates;
    }
}
