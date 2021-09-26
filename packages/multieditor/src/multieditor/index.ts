import { Agile, shared } from '@agile-ts/core';
import { EditorConfig, Multieditor } from './multieditor';

export * from './multieditor';

/**
 * Returns a newly created Multieditor.
 *
 * A Multieditor is a simple Form Handler.
 *
 * @public
 * @param config - Configuration object
 * @param agileInstance - Instance of Agile the Multieditor belongs to.
 */
export function createMultieditor<DataObjectType extends Object>(
  config: EditorConfig<DataObjectType>,
  agileInstance: Agile = shared
): Multieditor<DataObjectType> {
  return new Multieditor<DataObjectType>(config, agileInstance);
}
