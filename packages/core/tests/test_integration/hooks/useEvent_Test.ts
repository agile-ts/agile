import {
  Agile,
  Event,
  EventCallbackFunction,
  getAgileInstance,
} from "../../../src";

export function useEvent_Test<E extends Event<any>>(
  event: E,
  callback: EventCallbackFunction<E["payload"]>,
  callbackFunction: Function,
  key?: string,
  agileInstance?: Agile
) {
  // Get Agile Instance
  if (!agileInstance) {
    const tempAgileInstance = getAgileInstance(event);
    if (!tempAgileInstance) {
      console.error("Agile: Failed to get Agile Instance");
      return;
    }
    agileInstance = tempAgileInstance;
  }

  // Register CallbackFunction
  if (!key) event.on(callback);
  else event.on(key, callback);

  // Create a callback base subscription, Callback invokes re-render Trigger
  agileInstance?.subController.subscribeWithSubsArray(callbackFunction, [
    event.observer,
  ]);
}
