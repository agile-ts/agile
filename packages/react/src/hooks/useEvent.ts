import React from "react";
import { Event, EventCallbackFunction } from "@agile-ts/core";

export function useEvent<E extends Event<any>>(
  event: E,
  callback: EventCallbackFunction<E["payload"]>
) {
  React.useEffect(() => {
    const generatedKey = event.on(callback);
    return () => {
      event.removeCallback(generatedKey);
    };
  }, []);
}
