import {Agile, Observer, State, Computed, Job, copy, defineConfig, JobConfigInterface} from '../internal';

export class StateObserver<ValueType = any> extends Observer {

    public nextStateValue: ValueType;
    public state: State<ValueType>;
    public internalIngestKey = "THIS_IS_AN_INTERNAL_KEY_FOR_INGESTING_INTERNAL_STUFF";

    constructor(agileInstance: Agile, state: State) {
        super(agileInstance);
        this.state = state;
        this.nextStateValue = state.value;
        this.value = state.value;
        this.key = state.key;
    }


    //=========================================================================================================
    // Ingest
    //=========================================================================================================
    /**
     * @internal
     * Creates a Job out of State and new Value and than add it to a job queue
     * Note: its not possible to set a state to undefined because undefined is used for internal activities!
     */
    public ingest(newStateValue?: any, options: JobConfigInterface = {}): void {
        // Merge default values into options
        options = defineConfig<JobConfigInterface>(options, {
            perform: true,
            background: false,
            sideEffects: true,
            forceRerender: false
        });

        // Grab nextState if newState not passed or compute if needed
        if (newStateValue === this.internalIngestKey) {
            if (this.state instanceof Computed)
                this.nextStateValue = this.state.computeValue();
            else
                this.nextStateValue = this.state.nextState
        }
        this.nextStateValue = newStateValue;

        // Check if state value und newStateValue are the same.. if so return except force Rerender (stringifying because of possible object or array)
        if (JSON.stringify(this.state.value) === JSON.stringify(this.nextStateValue) && !options.forceRerender) {
            if (this.agileInstance().config.logJobs)
                console.warn("Agile: Doesn't created job because state values are the same! ");
            return;
        }

        // Ingest into runtime
        this.agileInstance().runtime.ingest(this, {});
    }


    //=========================================================================================================
    // Perform
    //=========================================================================================================
    /**
     * @internal
     * TOD_O
     */
    public perform(job: Job<this>) {
        const state = job.observable.state;

        // Set Previous State
        state.previousState = copy(state.value);

        // Write new value into the State
        state.privateWrite(this.nextStateValue);

        // Set isSet
        state.isSet = this.nextStateValue !== state.initialState;

        // Set is placeholder to false, because it has got a value
        if (state.isPlaceholder)
            state.isPlaceholder = false;

        // Perform SideEffects like watcher functions or state.sideEffects
        this.sideEffects(job);
    }


    //=========================================================================================================
    // Side Effect
    //=========================================================================================================
    /**
     * @internal
     * SideEffects are sideEffects of the perform function.. for instance the watchers
     */
    private sideEffects(job: Job<this>) {
        const state = job.observable.state;

        // Call Watchers
        for (let watcher in state.watchers)
            if (typeof state.watchers[watcher] === 'function')
                state.watchers[watcher](state.getPublicValue());

        // Call State SideEffects
        if (typeof state.sideEffects === 'function' && job.config?.sideEffects)
            state.sideEffects();

        // Ingest Dependencies of State (Perform is false because it will be performed anyway after this sideEffect)
       job.observable.dep.deps.forEach((observer) => observer instanceof StateObserver && observer.ingest(this.internalIngestKey, {perform: false}));
    }
}