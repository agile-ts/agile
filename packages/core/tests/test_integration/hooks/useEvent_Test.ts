import { Event, EventCallbackFunction } from "../../../src";

export function useEvent_Test<E extends Event>(
  event: E,
  callback: EventCallbackFunction<E["payload"]>
) {
  event.on(callback);
}
