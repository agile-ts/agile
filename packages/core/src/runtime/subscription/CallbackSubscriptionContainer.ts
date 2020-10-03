import {State} from "../../internal";
import {ComponentSubscriptionContainer} from "./ComponentSubscriptionContainer";

export class CallbackSubscriptionContainer extends ComponentSubscriptionContainer {
    public callback: Function;

    constructor(callback: Function, subs?: Set<State>) {
        super(null, subs);

        this.callback = callback;
    }
}