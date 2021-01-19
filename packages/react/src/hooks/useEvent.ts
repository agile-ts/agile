import React from 'react';
import {
  Agile,
  Event,
  EventCallbackFunction,
  getAgileInstance,
  SubscriptionContainerKeyType,
} from '@agile-ts/core';
import { useIsomorphicLayoutEffect } from '../utils/useIsomorphicLayoutEffect';

export function useEvent<E extends Event<any>>(
  event: E,
  callback: EventCallbackFunction<E['payload']>,
  key?: SubscriptionContainerKeyType,
  agileInstance?: Agile
): void {
  // Trigger State used to force the component to rerender
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
    const subscriptionContainer = agileInstance.subController.subscribeWithSubsArray(
      () => {
        forceRender();
      },
      [event.observer],
      key
    );

    // Unsubscribe Callback based Subscription and Event on Unmount
    return () => {
      agileInstance?.subController.unsubscribe(subscriptionContainer);
      event.removeCallback(generatedKey);
    };
  }, []);
}
