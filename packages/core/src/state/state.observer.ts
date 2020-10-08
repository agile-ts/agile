import {
    Agile,
    Observer,
    State,
    Computed,
    Job,
    JobConfigInterface,
    copy,
    defineConfig,
    ObserverKey
} from '../internal';

export const internalIngestKey = "THIS_IS_AN_INTERNAL_KEY_FOR_INGESTING_INTERNAL_STUFF";

export class StateObserver<ValueType = any> extends Observer {

    public state: () => State<ValueType>; // State on which the Observer is watching
    public nextStateValue: ValueType; // The next State value

    constructor(agileInstance: Agile, state: State, deps?: Array<Observer>, key?: ObserverKey) {
        super(agileInstance, deps, key);
        this.state = () => state;
        this.nextStateValue = state.value;
        this.value = state.value;
        this.hasValue = true; // States always have an value
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
        if (newStateValue === internalIngestKey) {
            if (this.state instanceof Computed)
                this.nextStateValue = this.state.computeValue();
            else
                this.nextStateValue = this.state().nextState
        } else
            this.nextStateValue = newStateValue;

        // Check if state value und newStateValue are the same.. if so return except force Rerender (stringifying because of possible object or array)
        if (JSON.stringify(this.state().value) === JSON.stringify(this.nextStateValue) && !options.forceRerender) {
            if (this.agileInstance().config.logJobs)
                console.warn("Agile: Doesn't created job because state values are the same! ");
            return;
        }

        // Ingest into runtime
        this.agileInstance().runtime.ingest(this, options);
    }


    //=========================================================================================================
    // Perform
    //=========================================================================================================
    /**
     * @internal
     * TOD_O
     */
    public perform(job: Job<this>) {
        const state = job.observer.state;

        // Set Previous State
        state().previousState = copy(state().value);

        // Write new value into the State
        state().privateWrite(this.nextStateValue);

        // Set isSet
        state().isSet = this.nextStateValue !== state().initialState;

        // Set is placeholder to false, because it has got a value
        if (state().isPlaceholder)
            state().isPlaceholder = false;

        // Set Observer value
        this.value = this.nextStateValue;

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
        const state = job.observer.state;

        // Call Watchers
        for (let watcher in state().watchers)
            if (typeof state().watchers[watcher] === 'function')
                state().watchers[watcher](state().getPublicValue());

        // Call State SideEffects
        if (typeof state().sideEffects === 'function' && job.config?.sideEffects)
            // @ts-ignore
            state().sideEffects();


        // Ingest Dependencies of State (Perform is false because it will be performed anyway after this sideEffect)
        job.observer.dep.deps.forEach((observer) => observer instanceof StateObserver && observer.ingest(internalIngestKey, {perform: false}));
    }
}