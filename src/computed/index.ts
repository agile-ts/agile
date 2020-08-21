import {State} from "../state";
import Agile from "../agile";

export class Computed<ComputedValueType = any> extends State<ComputedValueType> {
    public agileInstance: () => Agile;

    public computeFunction: () => ComputedValueType;
    public deps: Array<State> = [];

    constructor(agileInstance: Agile, computeFunction: () => ComputedValueType, deps?: Array<State>) {
        super(agileInstance, computeFunction());
        this.agileInstance = () => agileInstance;
        this.computeFunction = computeFunction;
        if (deps) {
            this.deps = deps;

            // Loop through all depending states of this computed and add this to the state dependencies -> this will be updated if on state changes
            deps.forEach(state => state.dep.depend(this));
        }

        // Recompute for setting initial state value and adding missing dependencies
        this.recompute();
    }

    public set value(value: ComputedValueType) {
        console.error('Agile: Can not mutate Computed value, please use recompute()');
    }

    public get value(): ComputedValueType {
        return super.value;
    }


    //=========================================================================================================
    // Compute Values
    //=========================================================================================================
    /**
     * Will add auto tracked dependencies to this and calls the computeFunction
     */
    public computeValue(): ComputedValueType {
        // Set tracking state to true which will than track all states which for instance call state.value
        this.agileInstance().runtime.trackState = true;

        // Call computeFunction
        const computedValue = this.computeFunction()

        // Get tracked states
        let foundStates = this.agileInstance().runtime.getFoundStates();
        foundStates.forEach(state => {
            // Check if state isn't a hard coded dependency if not.. add it to dependencies
            if (this.deps.findIndex(s => s === state) === -1) {
                this.deps.push(state);

                // Add this as dependencie of this state -> this will be updated if on state changes
                state.dep.depend(this)
            }
        });

        return computedValue;
    }


    //=========================================================================================================
    // Recompute
    //=========================================================================================================
    /**
     * Will call the computeFunction and update the dependencies
     */
    public recompute(): void {
        this.set(this.computeValue());
    }


    //=========================================================================================================
    // Overwriting some functions which can't be used in computed
    //=========================================================================================================

    public patch() {
        console.error('Agile: can not use patch method on Computed since the value is dynamic!');
        return this;
    }

    public persist(key?: string): this {
        console.error('Agile: Computed state can not be persisted since the value is dynamic!', key);
        return this;
    }
}
