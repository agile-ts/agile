import React from 'react';
import { StateWatcherCallback, State } from '@agile-ts/core';

export function useWatcher<T = any>(
  state: State<T>,
  callback: StateWatcherCallback<T>,
) {
  React.useEffect(() => {
    const generatedKey = state.watch(callback);
    return () => {
      state.removeWatcher(generatedKey);
    };
  }, []);
}
