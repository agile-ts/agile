import {Observer, SubscriptionContainer} from "../../internal";

export class ComponentSubscriptionContainer extends SubscriptionContainer{
    public component: any;

    constructor(component: any, subs?: Set<Observer>) {
        super(subs);
        this.component = component
    }
}