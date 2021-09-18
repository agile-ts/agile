import { defineConfig, removeProperties } from '@agile-ts/utils';
import { CreateAgileSubInstanceInterface, shared } from '../shared';
import { State, StateConfigInterface } from './state';
import { EnhancedState } from './state.enhanced';

export * from './state';
export * from './state.observer';
export * from './state.enhanced';
export * from './state.persistent';
export * from './state.runtime.job';

/**
 * Returns a newly created State.
 *
 * A State manages a piece of Information
 * that we need to remember globally at a later point in time.
 * While providing a toolkit to use and mutate this piece of Information.
 *
 * You can create as many global States as you need.
 *
 * [Learn more..](https://agile-ts.org/docs/core/agile-instance/methods#createstate)
 *
 * @public
 * @param initialValue - Initial value of the State.
 * @param config - Configuration object
 */
export function createLightState<ValueType = any>(
  initialValue: ValueType,
  config: CreateStateConfigInterfaceWithAgile = {}
): State<ValueType> {
  config = defineConfig(config, {
    agileInstance: shared,
  });
  return new State<ValueType>(
    config.agileInstance as any,
    initialValue,
    removeProperties(config, ['agileInstance'])
  );
}

// TODO 'createState' doesn't get entirely treeshaken away (React project)
/**
 * Returns a newly created enhanced State.
 *
 * An enhanced State manages, like a normal State, a piece of Information
 * that we need to remember globally at a later point in time.
 * While providing a toolkit to use and mutate this piece of Information.
 *
 * The main difference to a normal State is however
 * that an enhanced State provides a wider variety of inbuilt utilities (like a persist, undo, watch functionality)
 * but requires a larger bundle size in return.
 *
 * You can create as many global enhanced States as you need.
 *
 * [Learn more..](https://agile-ts.org/docs/core/agile-instance/methods#createstate)
 *
 * @public
 * @param initialValue - Initial value of the State.
 * @param config - Configuration object
 */
export function createState<ValueType = any>(
  initialValue: ValueType,
  config: CreateStateConfigInterfaceWithAgile = {}
): EnhancedState<ValueType> {
  config = defineConfig(config, {
    agileInstance: shared,
  });
  return new EnhancedState<ValueType>(
    config.agileInstance as any,
    initialValue,
    removeProperties(config, ['agileInstance'])
  );
}

export interface CreateStateConfigInterfaceWithAgile
  extends CreateAgileSubInstanceInterface,
    StateConfigInterface {}
