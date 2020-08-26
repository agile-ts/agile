import Agile from "../agile";
import {copy, defineConfig, flatMerge, isValidObject} from "../utils";
import Dep from "./dep";
import {persistValue, updateValue} from "./persist";
import {StorageKey} from "../storage";

export type StateKey = string | number;

export class State<ValueType = any> {
    public agileInstance: () => Agile;

    public _key?: StateKey; // should be a unique key/name which identifies the state
    public valueType?: string; // primitive types for js users
    public dep: Dep; // Includes the subscriptions and dependencies of the state
    public watchers: { [key: string]: (value: any) => void } = {};
    public sideEffects?: Function;  // SideEffects can be set by extended classes, such as Groups to build their output.
    public isSet: boolean = false; // Has been changed from initial value
    public isPersistState: boolean = false; // Is saved in storage
    public output?: any; // This contains the public value.. if _value doesn't contain the public value (Used for example by collections)

    public initialState: ValueType;
    public _value: ValueType; // The current value of the state
    public previousState: ValueType; // Will be set in runtime
    public nextState: ValueType; // The next state is used internal and represents the nextState which can be edited as wished (cleaner than always setting the state)

    // public computeValue?: (newState?: ValueType) => ValueType;

    constructor(agileInstance: Agile, initialState: ValueType, key?: StateKey, deps: Array<Dep> = []) {
        this.agileInstance = () => agileInstance;
        this.initialState = initialState;
        this.dep = new Dep(deps);
        this._key = key;
        this._value = initialState;
        this.previousState = initialState;
        this.nextState = initialState;
    }

    public set value(value: ValueType) {
        this.set(value);
    }

    public get value(): ValueType {
        // Add state to foundState (for auto tracking used states in computed functions)
        if (this.agileInstance().runtime.trackState)
            this.agileInstance().runtime.foundStates.add(this);

        return this._value;
    }

    public set key(value: StateKey | undefined) {
        this._key = value;
    }

    public get key(): StateKey | undefined {
        return this._key;
    }


    //=========================================================================================================
    // Set
    //=========================================================================================================
    /**
     * Directly set state to a new value, if nothing is passed in State.nextState will be used as the next value
     */
    public set(value?: ValueType, options: { background?: boolean, sideEffects?: boolean } = {}): this {
        // Causes a rerender on this State without changing it
        if (arguments[0] === undefined) {
            this.agileInstance().runtime.ingest(this);
            return this;
        }

        // Assign defaults to options
        options = defineConfig(options, {
            sideEffects: true
        });

        // Check if Type is Correct
        if (this.valueType && !this.isCorrectType(value)) {
            console.warn(`Agile: Incorrect type (${typeof value}) was provided. Type fixed to ${this.valueType}`);
            return this;
        }

        // Check if something has changed
        if (this.value === value || JSON.stringify(this.value) === JSON.stringify(value))
            return this;

        // Ingest update
        this.agileInstance().runtime.ingest(this, value, {
            background: options.background,
            sideEffects: options.sideEffects
        });

        this.isSet = value !== this.initialState;
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
        if (this.isPersistState && this.key)
            this.agileInstance().storage.remove(this.key);

        // Set State to initial State
        this.set(this.initialState);
        return this;
    }


    //=========================================================================================================
    // Patch
    //=========================================================================================================
    /**
     * Will merge the changes into the state
     */
    public patch(targetWithChanges: Object): this {
        // Check if state is object.. because only objects can use the patch method
        if (!isValidObject(this.nextState)) {
            console.error("Agile: You can't use the patch method an a non object state!");
            return this;
        }

        // Merge targetWithChanges into next State
        this.nextState = flatMerge<ValueType>(this.nextState, targetWithChanges);

        // Check if something has changed
        if (this.value === this.nextState)
            return this;

        // Set State to nextState
        this.set();

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
     * @param key - the storage key (if no key passed it will take the state key)
     */
    public persist(key?: StorageKey): this {
        persistValue(this, key).then((value) => {
            this.isPersistState = value
        });
        return this;
    }


    //=========================================================================================================
    // Copy
    //=========================================================================================================
    /**
     * Returns a fresh copy of the current value
     */
    public copy(): ValueType {
        return copy(this.value);
    }


    //=========================================================================================================
    // Get Public Value
    //=========================================================================================================
    /**
     * @internal
     *  Returns 100% the public value of a state because at some points (group) the _value contains only keys
     */
    public getPublicValue(): ValueType {
        if (this.output !== undefined)
            return this.output;
        return this._value;
    }


    //=========================================================================================================
    // Private Write
    //=========================================================================================================
    /**
     * @internal
     *  Will set a new _value and handles the stuff around like storage, ..
     */
    public privateWrite(value: any) {
        this._value = copy(value);
        this.nextState = copy(value);

        // Save changes in Storage
        updateValue(this);
    }


    //=========================================================================================================
    // Get Persistable Value
    //=========================================================================================================
    /**
     * @internal
     *  Will return the perstiable Value of this state..
     *  some classes which extends state might have another peristiableValue than this.value (like the selector)
     */
    public getPersistableValue(): any {
        return this.value;
    }


    //=========================================================================================================
    // Helper
    //=========================================================================================================

    private isCorrectType(value: any): boolean {
        let type: string = typeof value;
        return type === this.valueType;
    }
}
