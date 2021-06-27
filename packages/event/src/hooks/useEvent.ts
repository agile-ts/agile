import React from 'react';
import {
  Agile,
  getAgileInstance,
  SubscriptionContainerKeyType,
} from '@agile-ts/core';
import { Event, EventCallbackFunction } from '../internal';
import { useIsomorphicLayoutEffect } from './useIsomorphicLayoutEffect';

export function useEvent<E extends Event<any>>(
  event: E,
  callback: EventCallbackFunction<E['payload']>,
  key?: SubscriptionContainerKeyType,
  agileInstance?: Agile
): void {
  // Trigger State used to force Component to rerender
  const [, forceRender] = React.useReducer((s) => s + 1, 0);

  useIsomorphicLayoutEffect(() => {
    const generatedKey = event.on(callback);

    // Get Agile Instance
    if (!agileInstance) agileInstance = getAgileInstance(event);
    if (!agileInstance || !agileInstance.subController) {
      Agile.logger.error('Failed to subscribe Component with deps', event);
      return;
    }

    // Create Callback based Subscription
    const subscriptionContainer = agileInstance.subController.subscribe(
      () => {
        forceRender();
      },
      [event.observer],
      { key }
    );

    // Unsubscribe Callback based Subscription and Event on Unmount
    return () => {
      agileInstance?.subController.unsubscribe(subscriptionContainer);
      event.removeCallback(generatedKey);
    };
  }, []);
}
