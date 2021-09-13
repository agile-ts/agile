import React from 'react';
import { StateWatcherCallback, EnhancedState } from '@agile-ts/core';

export function useWatcher<T = any>(
  state: EnhancedState<T>,
  callback: StateWatcherCallback<T>
): void {
  React.useEffect(() => {
    const generatedKey = state.watch(callback);
    return () => {
      state.removeWatcher(generatedKey);
    };
  }, []);
}
