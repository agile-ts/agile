import {Agile, Dep, StateKey, Job} from "../internal";

export type ObserverKey = string | number;

export class Observer<ValueType = any> {

    public agileInstance: () => Agile;

    public _key?: ObserverKey;
    public dep: Dep; // Dependencies and Subscriptions of the Observer

    public hasValue: boolean = false; // Weather the Observer has an value or not
    public value: any; // Value of the Observer if it has one

    constructor(agileInstance: Agile, deps?: Array<Observer>, key?: ObserverKey) {
        this.agileInstance = () => agileInstance;
        this.dep = new Dep(deps);
        this._key = key;
    }

    public set key(value: StateKey | undefined) {
        this._key = value;
    }

    public get key(): StateKey | undefined {
        return this._key;
    }

    public perform(job: Job) {
       console.warn("Didn't set perform function in Observer ", this.key);
    }
}