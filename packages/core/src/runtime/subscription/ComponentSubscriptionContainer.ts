import {State} from "../../internal";
import {Observer} from "../observer";

export class ComponentSubscriptionContainer {
    public component: any;

    // Only needed by object orientated subscriptions
    public passProps: boolean = false;
    public propObservable?: { [key: string]: Observer }; // states which will than be returned as prop object by the integration
    public propKeysChanged: Array<string> = [];  // Used to preserve local keys to update before update is performed, cleared every update

    public ready: boolean = false;
    public subs: Set<Observer> = new Set<Observer>([]); // States that are subscribed by this component

    constructor(component: any, subs?: Set<Observer>) {
        this.component = component
        if (subs)
            this.subs = subs;
    }
}