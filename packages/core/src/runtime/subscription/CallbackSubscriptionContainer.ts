import {ComponentSubscriptionContainer} from "./ComponentSubscriptionContainer";
import {Observer} from "../observer";

export class CallbackSubscriptionContainer extends ComponentSubscriptionContainer {
    public callback: Function;

    constructor(callback: Function, subs?: Set<Observer>) {
        super(null, subs);

        this.callback = callback;
    }
}