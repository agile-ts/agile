import { defineConfig } from '@agile-ts/utils';
import { shared } from '../../shared';
import { State } from '../state';
import { CreateStateConfigInterfaceWithAgile } from './index';

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
    config
  );
}
