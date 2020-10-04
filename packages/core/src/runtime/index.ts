import {
    Agile,
    Computed,
    SubscriptionContainer,
    copy,
    defineConfig
} from '../internal';
import {CallbackSubscriptionContainer} from "./subscription/CallbackSubscriptionContainer";
import {Observer} from "./observer";
import {Job} from "./job";


export interface JobConfigInterface {
    perform?: boolean // Should preform the job instantly
    background?: boolean // Shouldn't cause an rerender during the perform process
    sideEffects?: boolean // Should perform sideEffects like rebuilding groups
    forceRerender?: boolean // Force rerender although for instance the values are the same
}

export class Runtime {
    public agileInstance: () => Agile;

    // Queue system
    private currentJob: Job | null = null;
    private jobQueue: Array<Job> = [];
    private jobsToRerender: Array<Job> = [];

    // Used for tracking computed dependencies
    public trackState: boolean = false; // Check if agile should track states
    public foundStates: Set<Observer> = new Set(); // States which were tracked during the track time

    constructor(agileInstance: Agile) {
        this.agileInstance = () => agileInstance;
    }

    public ingest(worker: Observer, options: JobConfigInterface): void {
        // Merge default values into options
        options = defineConfig<JobConfigInterface>(options, {
            perform: true,
            background: false,
            sideEffects: true,
            forceRerender: false
        });

        // Create Job
        const job = new Job(worker, {
            background: options.background,
            sideEffects: options.sideEffects,
            forceRerender: options.forceRerender
        });

        // Logging
        if (this.agileInstance().config.logJobs)
            console.log(`Agile: Created Job(${job.observable.key})`, job);

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
    private perform(job: Job): void {
        // Set Job to currentJob
        this.currentJob = job;

        // Perform Job
        job.observable.perform(job);
        job.performed = true;

        // Add to rerender
        if (job.rerender)
            this.jobsToRerender.push(job);

        // Reset Current Job
        this.currentJob = null;

        // Logging
        if (this.agileInstance().config.logJobs)
            console.log(`Agile: Completed Job(${job.observable.key})`, job);

        // Continue the Loop and perform the next job.. if no job is left update the Subscribers for each completed job
        if (this.jobQueue.length > 0) {
            const performJob = this.jobQueue.shift();
            if (performJob)
                this.perform(performJob);
        } else {
            // https://stackoverflow.com/questions/9083594/call-settimeout-without-delay
            setTimeout(() => {
                // Cause rerender on Subscribers
                this.updateSubscribers();
            });
        }
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
        if (!this.agileInstance().integrations.hasIntegration())
            return;

        // Subscriptions that has to be updated (Set = For preventing double subscriptions without further checks)
        const subscriptionsToUpdate: Set<SubscriptionContainer> = new Set<SubscriptionContainer>();

        // Map through Jobs to Rerender
        this.jobsToRerender.forEach(job =>
            // Map through subs of the current Job State
            job.observable.dep.subs.forEach(subscriptionContainer => {
                // Check if subscriptionContainer is ready
                if (!subscriptionContainer.ready)
                    console.warn("Agile: SubscriptionContainer isn't ready yet ", subscriptionContainer);

                // For a Container that require props to be passed
                if (subscriptionContainer.passProps) {
                    let localKey: string | null = null;

                    // Find the local Key for this update by comparing the State instance from this Job to the State instances in the propStates object
                    for (let key in subscriptionContainer.propObservable)
                        if (subscriptionContainer.propObservable[key] === job.observable)
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
            if (subscriptionContainer instanceof CallbackSubscriptionContainer) {
                subscriptionContainer.callback();
                return;
            }

            // If Component based subscription call the updateMethod
            this.agileInstance().integrations.update(subscriptionContainer.component, this.formatChangedPropKeys(subscriptionContainer));
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
            if (subscriptionContainer.propObservable)
                finalObject[changedKey] = subscriptionContainer.propObservable[changedKey].value;
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
    public getTrackedStates() {
        const finalFoundStates = this.foundStates;

        // Reset tracking
        this.trackState = false;
        this.foundStates = new Set();

        return finalFoundStates;
    }
}
