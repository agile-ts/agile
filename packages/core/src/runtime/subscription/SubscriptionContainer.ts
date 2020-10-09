import {Observer} from "../../internal";

export class SubscriptionContainer {

    // For Object orientated subscriptions
    public passProps: boolean = false;
    public propKeysChanged: Array<string> = []; // Used to preserve local keys to update before update is performed, cleared every update

    public ready: boolean = false;
    public subs: Set<Observer> = new Set<Observer>([]); // Observers that are Subscribed to this Subscription Container

    constructor(subs?: Set<Observer>) {
        if (subs) this.subs = subs;
    }
}