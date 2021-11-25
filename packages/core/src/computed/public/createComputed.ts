import {
  Computed,
  ComputeFunctionType,
  DependableAgileInstancesType,
} from '../computed';
import { defineConfig } from '@agile-ts/utils';
import { shared } from '../../shared';
import { CreateComputedConfigInterfaceWithAgile } from './index';

/**
 * Returns a newly created Computed.
 *
 * A Computed is an extension of the State Class
 * that computes its value based on a specified compute function.
 *
 * The computed value will be cached to avoid unnecessary recomputes
 * and is only recomputed when one of its direct dependencies changes.
 *
 * Direct dependencies can be States and Collections.
 * So when, for example, a dependent State value changes, the computed value is recomputed.
 *
 * [Learn more..](https://agile-ts.org/docs/core/agile-instance/methods#createcomputed)
 *
 * @public
 * @param computeFunction - Function to compute the computed value.
 * @param config - Configuration object
 */
export function createComputed<ComputedValueType = any>(
  computeFunction: ComputeFunctionType<ComputedValueType>,
  config?: CreateComputedConfigInterfaceWithAgile
): Computed<ComputedValueType>;
/**
 * Returns a newly created Computed.
 *
 * A Computed is an extension of the State Class
 * that computes its value based on a specified compute function.
 *
 * The computed value will be cached to avoid unnecessary recomputes
 * and is only recomputed when one of its direct dependencies changes.
 *
 * Direct dependencies can be States and Collections.
 * So when, for example, a dependent State value changes, the computed value is recomputed.
 *
 * [Learn more..](https://agile-ts.org/docs/core/agile-instance/methods#createcomputed)
 *
 * @public
 * @param computeFunction - Function to compute the computed value.
 * @param deps - Hard-coded dependencies on which the Computed Class should depend.
 */
export function createComputed<ComputedValueType = any>(
  computeFunction: ComputeFunctionType<ComputedValueType>,
  deps?: Array<DependableAgileInstancesType>
): Computed<ComputedValueType>;
export function createComputed<ComputedValueType = any>(
  computeFunction: ComputeFunctionType<ComputedValueType>,
  configOrDeps?:
    | CreateComputedConfigInterfaceWithAgile
    | Array<DependableAgileInstancesType>
): Computed<ComputedValueType> {
  let _config: CreateComputedConfigInterfaceWithAgile = {};

  if (Array.isArray(configOrDeps)) {
    _config = defineConfig(_config, {
      computedDeps: configOrDeps,
    });
  } else {
    if (configOrDeps) _config = configOrDeps;
  }

  _config = defineConfig(_config, { agileInstance: shared });

  return new Computed<ComputedValueType>(
    _config.agileInstance as any,
    computeFunction,
    _config
  );
}
