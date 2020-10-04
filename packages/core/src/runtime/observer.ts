import {Agile, Dep, StateKey} from "../internal";
import {Job} from "./job";

export type ObservableKey = string | number;

export class Observer {

    public agileInstance: () => Agile;

    public _key?: ObservableKey;
    public dep: Dep;
    public value: any; // The current value which will be returned for instance if its a prop based subscription

    constructor(agileInstance: Agile) {
        this.agileInstance = () => agileInstance;
        this.dep = new Dep();
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