import {Observer, SubscriptionContainer} from "../../internal";

export class CallbackSubscriptionContainer extends SubscriptionContainer{
    public callback: Function;

    constructor(callback: Function, subs?: Set<Observer>) {
        super(subs);

        this.callback = callback;
    }
}