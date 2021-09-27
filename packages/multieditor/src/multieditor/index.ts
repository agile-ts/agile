import { Agile, shared } from '@agile-ts/core';
import { Multieditor } from './multieditor';
import { EditorConfig, FieldData } from './types';

export * from './multieditor';
export * from './types';

/**
 * Returns a newly created Multieditor.
 *
 * A Multieditor is a simple Form Handler.
 *
 * @public
 * @param config - Configuration object
 * @param agileInstance - Instance of Agile the Multieditor belongs to.
 */
export function createMultieditor<TFieldData extends FieldData = FieldData>(
  config: EditorConfig<TFieldData>,
  agileInstance: Agile = shared
): Multieditor<TFieldData> {
  return new Multieditor<TFieldData>(config, agileInstance);
}
