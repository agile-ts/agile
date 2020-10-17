import { Agile, Dep, StateKey, Job } from "../../internal";

export type ObserverKey = string | number;

export class Observer<ValueType = any> {
  public agileInstance: () => Agile;

  public _key?: ObserverKey;
  public dep: Dep; // Dependencies and Subscriptions of Observer
  public value?: ValueType; // Value of Observer

  constructor(
    agileInstance: Agile,
    deps?: Array<Observer>,
    key?: ObserverKey,
    value?: ValueType
  ) {
    this.agileInstance = () => agileInstance;
    this.dep = new Dep(deps);
    this._key = key;
    this.value = value;
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
