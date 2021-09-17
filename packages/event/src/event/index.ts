import { CreateAgileSubInstanceInterface, shared } from '@agile-ts/core';
import { defineConfig, removeProperties } from '@agile-ts/utils';
import {
  CreateEventConfigInterface,
  DefaultEventPayload,
  Event,
} from './event';

export * from './event';
export * from './event.observer';
export * from './event.runtime.job';

export function createEvent<PayloadType = DefaultEventPayload>(
  config: CreateEventConfigInterfaceWithAgile = {}
): Event<PayloadType> {
  config = defineConfig(config, {
    agileInstance: shared,
  });
  return new Event<PayloadType>(
    config.agileInstance as any,
    removeProperties(config, ['agileInstance'])
  );
}

export interface CreateEventConfigInterfaceWithAgile
  extends CreateEventConfigInterface,
    CreateAgileSubInstanceInterface {}
