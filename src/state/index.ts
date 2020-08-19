import Agile from "../agile";
import {copy} from "../utils";
import Dep from "./dep";
import {persistValue} from "./persist";

export class State<ValueType = any> {

    public agileInstance: Agile;

    public _key?: string;
    public valueType?: string; // primitive types for js users
    public dep: Dep; // Includes the subscriptions and dependencies of the state
    public watchers: { [key: string]: (value: any) => void } = {};
    public sideEffects?: Function;  // SideEffects can be set by extended classes, such as Groups to build their output.
    public isSet: boolean = false; // Has been changed from initial value
    public isPersistState: boolean = false; // Is saved in storage

    public initialState: ValueType;
    public _value: ValueType; // The current value of the state
    public previousState: ValueType; // Will be set in runtime
    public nextState: ValueType; // The next state if the newValue is undefined -> a backup value

    // public computeValue?: (newState?: ValueType) => ValueType;

    constructor(agileInstance: Agile, initialState: ValueType, deps: Array<Dep> = []) {
        this.agileInstance = agileInstance;
        this.initialState = initialState;
        this.dep = new Dep(deps);

        this._value = initialState;
        this.previousState = initialState;
        this.nextState = initialState;
    }

    public set value(value: ValueType) {
        this._value = value;
    }

    public get value(): ValueType {
        return this._value;
    }

    public set key(value: string | undefined) {
        this._key = value;
    }

    public get key(): string | undefined {
        return this._key;
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

        // Check Type is Correct
        if (this.valueType && !this.isCorrectType(newState)) {
            console.warn(`Agile: Incorrect type (${typeof newState}) was provided. Type fixed to ${this.valueType}`);
            return this;
        }

        // Ingest update
        this.agileInstance.runtime.ingest(this, newState, {
            background: options.background
        });

        // Execute Side Effects
        if (this.sideEffects)
            this.sideEffects();

        this.isSet = newState !== this.initialState;
        return this;
    }


    //=========================================================================================================
    // Type
    //=========================================================================================================
    /**
     * This is thought for js users.. because ts users can set the type in <>
     * @param type - wished type of the state
     */
    public type(type: any): this {
        // Supported types
        const supportedTypes = ['String', 'Boolean', 'Array', 'Object', 'Number'];

        // Check if type is a supported Type
        if (supportedTypes.findIndex(supportedType => supportedType === type.name) === -1) {
            console.warn(`Agile: '${type}' is not supported! Supported types: String, Boolean, Array, Object, Number`);
            return this;
        }

        // Set valueType
        this.valueType = type.name.toLowerCase();
        return this;
    }


    //=========================================================================================================
    // Set Key
    //=========================================================================================================
    /**
     * Will define the key of this state which will be outputted for instance in logs or used as storage key
     * @param key
     */
    public setKey(key: string): this {
        this._key = key;
        return this;
    }


    //=========================================================================================================
    // Undo
    //=========================================================================================================
    /**
     * Will set the state to the previous State
     */
    public undo() {
        this.set(this.previousState);
    }


    //=========================================================================================================
    // Reset
    //=========================================================================================================
    /**
     * Will reset the state to the initial value
     */
    public reset(): this {
        // Remove State from Storage (because it is than the initial State again and there is no need to save it anymore)
        if (this.isPersistState)
            this.agileInstance.storage.remove(this.key || '');

        // Set State to initial State
        this.set(this.initialState);
        return this;
    }


    //=========================================================================================================
    // Watch
    //=========================================================================================================
    /**
     * Will always be called if the state changes
     * @param key - The key of the watch method
     * @param callback - The callback function
     */
    public watch(key: string, callback: (value: ValueType) => void): this {
        // Check if callback is a function  (js)
        if (typeof callback !== 'function') {
            console.error('A callback has to be a function');
            return this;
        }

        // Check if key is a string (because its a key of an object) (js)
        if (typeof key !== 'string') {
            console.error('A key has to be a string');
            return this;
        }

        // Add callback with key to watchers
        this.watchers[key] = callback;

        return this;
    }


    //=========================================================================================================
    // Remove Watcher
    //=========================================================================================================
    /**
     * Removes a watcher called after the key
     * @param key - the key of the watcher function
     */
    public removeWatcher(key: string): this {
        delete this.watchers[key];
        return this;
    }


    //=========================================================================================================
    // Persist
    //=========================================================================================================
    /**
     * Saves the state in the local storage or in a own configured storage
     * @param key - the storage key
     */
    public persist(key?: string): this {
        this.isPersistState = true;
        persistValue(this, key);
        return this;
    }


    //=========================================================================================================
    // Private Write
    //=========================================================================================================
    /**
     * @internal
     *  Will set a new _masterValue without causing a rerender
     */
    public privateWrite(value: any) {
        this.value = copy(value);
        this.nextState = copy(value);

        // Save changes in Storage
        if (this.isPersistState && this.key)
            this.agileInstance.storage.set(this.key, this.value);
    }


    //=========================================================================================================
    // Helper
    //=========================================================================================================

    private isCorrectType(value: any): boolean {
        let type: string = typeof value;
        return type === this.valueType;
    }
}
