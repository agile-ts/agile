import {
  CreateAgileSubInstanceInterface,
  defineConfig,
  removeProperties,
  shared,
} from '@agile-ts/core';
import {
  Event,
  CreateEventConfigInterface,
  DefaultEventPayload,
} from './internal';

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
