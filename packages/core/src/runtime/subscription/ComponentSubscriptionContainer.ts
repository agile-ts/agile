import {State} from "../../internal";

export class ComponentSubscriptionContainer {
    public component: any;

    // Only needed by object orientated subscriptions
    public passProps: boolean = false;
    public propStates?: { [key: string]: State }; // states which will than be returned as prop object by the integration
    public propKeysChanged: Array<string> = [];  // Used to preserve local keys to update before update is performed, cleared every update

    public ready: boolean = false;
    public subs: Set<State> = new Set<State>([]); // States that are subscribed by this component

    constructor(component: any, subs?: Set<State>) {
        this.component = component
        if (subs)
            this.subs = subs;
    }
}