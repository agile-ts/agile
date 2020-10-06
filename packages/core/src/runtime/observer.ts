import {Agile, Dep, StateKey, Job} from "../internal";

export type ObservableKey = string | number;

export class Observer {

    public agileInstance: () => Agile;

    public _key?: ObservableKey;
    public dep: Dep; // Dependencies and Subscriptions of the Observer

    public hasValue: boolean = false; // Weather the Observer has an value or not
    public value: any; // Value of the Observer if it has one

    constructor(agileInstance: Agile, deps?: Array<Observer>) {
        this.agileInstance = () => agileInstance;
        this.dep = new Dep(deps);
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