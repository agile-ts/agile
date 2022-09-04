import { EnhancedState } from '../state.enhanced';
import { createEnhancedState } from './createEnhancedState';
import { CreateStateConfigInterfaceWithAgile } from './types';

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
  return createEnhancedState(initialValue, config);
}
