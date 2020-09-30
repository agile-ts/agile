import {Event, EventCallbackFunction} from '@agile/core';

export function useEvent<E extends Event>(event: E, callback: EventCallbackFunction<E['payload']>) {
    event.on(callback);
}
