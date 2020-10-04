import {Agile, StateKey} from "../internal";
import {Job} from "./job";

export type WorkerKey = string | number;

export class Worker {

    public agileInstance: () => Agile;
    public _key?: WorkerKey;

    constructor(agileInstance: Agile) {
        this.agileInstance = () => agileInstance;
    }

    public set key(value: StateKey | undefined) {
        this._key = value;
    }

    public get key(): StateKey | undefined {
        return this._key;
    }

    public perform(job: Job) {
       console.warn("Didn't set perform function in Worker ", this.key);
    }
}