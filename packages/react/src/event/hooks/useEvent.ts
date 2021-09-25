import React from 'react';
import {
  Agile,
  getAgileInstance,
  SubscriptionContainerKeyType,
} from '@agile-ts/core';
import type { Event, EventCallbackFunction } from '@agile-ts/event'; // When only importing the types the "Can't resolve '@agile-ts/event'" error doesn't occur
import { useIsomorphicLayoutEffect } from '../../general';
import { eventPackage } from '../eventPackage';
import { LogCodeManager } from '../../logCodeManager';

export function useEvent<E extends Event<any>>(
  event: E,
  callback: EventCallbackFunction<E['payload']>,
  key?: SubscriptionContainerKeyType,
  agileInstance?: Agile
): void {
  // Return if '@agile-ts/event' isn't installed
  if (eventPackage == null) {
    LogCodeManager.log('33:03:00');
    return;
  }

  // Trigger State used to force Component to rerender
  const [, forceRender] = React.useReducer((s) => s + 1, 0);

  useIsomorphicLayoutEffect(() => {
    const generatedKey = event.on(callback);

    // Get Agile Instance
    if (!agileInstance) agileInstance = getAgileInstance(event);
    if (!agileInstance || !agileInstance.subController) {
      LogCodeManager.getLogger()?.error(
        'Failed to subscribe Component with deps',
        event
      );
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
