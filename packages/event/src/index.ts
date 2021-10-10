import { CreateAgileSubInstanceInterface, shared } from '@agile-ts/core';
import { defineConfig } from '@agile-ts/utils';
import {
  CreateEventConfigInterface,
  DefaultEventPayload,
  Event,
} from './event';

export * from './event';
export * from './event.observer';
export * from './event.runtime.job';

export default Event;

export function createEvent<PayloadType = DefaultEventPayload>(
  config: CreateEventConfigInterfaceWithAgile = {}
): Event<PayloadType> {
  config = defineConfig(config, {
    agileInstance: shared,
  });
  return new Event<PayloadType>(config.agileInstance as any, config);
}

export interface CreateEventConfigInterfaceWithAgile
  extends CreateEventConfigInterface,
    CreateAgileSubInstanceInterface {}
