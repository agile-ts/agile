import {Event, EventCallbackFunction} from '@agile-ts/core';

export function useEvent_Test<E extends Event>(event: E, callback: EventCallbackFunction<E['payload']>) {
    event.on(callback);
}
