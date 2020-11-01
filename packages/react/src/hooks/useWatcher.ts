import * as React from "react";
import { Callback, State } from "@agile-ts/core";

export function useWatcher<T = any>(state: State<T>, callback: Callback<T>) {
  React.useEffect(() => {
    const generatedKey = state.watch(callback);
    return () => {
      state.removeWatcher(generatedKey);
    };
  }, []);
}
