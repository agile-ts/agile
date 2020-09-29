import Event, {EventCallbackFunction} from "../../../event";
import Agile from "../../../index";
import {getAgileInstance} from "../../../utils";

export function useEvent<E extends Event>(event: E, callback: EventCallbackFunction<E['payload']>, agileInstance?: Agile) {
    // Get Agile Instance
    if (!agileInstance) {
        const tempAgileInstance = getAgileInstance(event);
        if (!tempAgileInstance) {
            console.error("Agile: Failed to get Agile Instance");
            return;
        }
        agileInstance = tempAgileInstance;
    }

    // Call on Event
    event.on(callback);
}
