import Agile from "../agile";
import {copy} from "../utils";
import Dep from "./dep";

export class State<ValueType = any> {

    public agileInstance: Agile;

    public name?: string;
    public valueType?: string;
    public dep: Dep;
    public sideEffects?: Function;  // SideEffects can be set by extended classes, such as Groups to build their output.

    public set value(value: ValueType) {
        this._masterValue = value;
    }

    public get value(): ValueType {
        return this._masterValue;
    }

    public initialState: ValueType;
    public _masterValue: ValueType;
    public previousState: ValueType;
    public nextState: ValueType;

    // public computeValue?: (newState?: ValueType) => ValueType;

    constructor(agileInstance: Agile, initialState: ValueType, deps: Array<Dep> = []) {
        this.agileInstance = agileInstance;
        this.initialState = initialState;
        this.dep = new Dep(deps);

        this._masterValue = initialState;
        this.previousState = initialState;
        this.nextState = initialState;
    }


    //=========================================================================================================
    // Set
    //=========================================================================================================
    /**
     * Directly set state to a new value, if nothing is passed in State.nextState will be used as the next value
     * @param {ValueType} newState - The new value for this state
     */
    public set(newState?: ValueType, options: { background?: boolean } = {}): this {
        // Causes a rerender on this State without changing it
        if (newState === undefined) {
            this.agileInstance.runtime.ingest(this, undefined);
            return this;
        }

        // check type if set and correct otherwise exit
        if (this.valueType) {
            console.warn(`Pulse: Error setting state: Incorrect type (${typeof newState}) was provided. Type fixed to ${this.valueType}`);
            return this;
        }

        // Ingest update using most basic mutation method
        if (options.background) {
            this.privateWrite(newState);
            if (this.sideEffects) this.sideEffects();
        } else {
            this.agileInstance.runtime.ingest(this, newState);
        }

        return this;
    }


    //=========================================================================================================
    // Type
    //=========================================================================================================
    /**
     * Directly set state to a new value, if nothing is passed in State.nextState will be used as the next value
     * @param type - wished type of the state
     */
    public type(type: any): this {
        const supportedConstructors = ['String', 'Boolean', 'Array', 'Object', 'Number'];
        if (typeof type === 'function' && supportedConstructors.findIndex(supportedConstructor => supportedConstructor === type.name) !== -1) {
            this.valueType = type.name.toLowerCase();
        }
        return this;
    }


    //=========================================================================================================
    // Get Public Value
    //=========================================================================================================
    /**
     * Returns the Public Value of this state -> _masterValue
     */
    public getPublicValue(): ValueType {
        return this._masterValue;
    }


    //=========================================================================================================
    // Key
    //=========================================================================================================
    /**
     * Will define the key of this state which will be outputted for instance in logs
     * @param key
     */
    public key(key: string): this {
        this.name = key;
        return this;
    }


    //=========================================================================================================
    // Private Write
    //=========================================================================================================
    /**
     * @internal
     *  Will set a new _masterValue without causing a rerender
     * @param value
     */
    public privateWrite(value: any) {
        this._masterValue = copy(value);
        this.nextState = copy(value);
    }


}
