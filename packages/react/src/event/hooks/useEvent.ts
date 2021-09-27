import type { Event, EventCallbackFunction } from '@agile-ts/event'; // When only importing the types the "Can't resolve '@agile-ts/event'" error doesn't occur
import { useIsomorphicLayoutEffect } from '../../general';
import { eventPackage } from '../eventPackage';
import { logCodeManager } from '../../logCodeManager';
import { BaseAgileHookConfigInterface, useBaseAgile } from '../../core';
import { defineConfig, generateId } from '@agile-ts/utils';

export function useEvent<E extends Event<any>>(
  event: E,
  callback: EventCallbackFunction<E['payload']>,
  config: BaseAgileHookConfigInterface = {}
): void {
  config = defineConfig(config, {
    key: generateId(),
    agileInstance: null as any,
    componentId: undefined,
    deps: [],
  });

  // Return if '@agile-ts/event' isn't installed
  if (eventPackage == null) {
    logCodeManager.log('33:03:00');
    return;
  }

  // Handle Event Logic
  useIsomorphicLayoutEffect(() => {
    const eventKey = event.on(callback);

    // Unsubscribe Event on unmount
    return () => {
      event.removeCallback(eventKey);
    };
  }, []);

  // Subscribe Event to Component
  useBaseAgile(
    [event.observer],
    () => ({
      key: config.key,
      waitForMount: false,
      componentId: config.componentId,
    }),
    [],
    config.agileInstance
  );
}
