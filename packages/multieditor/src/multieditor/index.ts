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
export function createMultieditor<
  DataType = any,
  SubmitReturnType = void,
  OnSubmitConfigType = any
>(
  config: EditorConfig<DataType, SubmitReturnType, OnSubmitConfigType>,
  agileInstance: Agile = shared
): Multieditor<DataType, SubmitReturnType, OnSubmitConfigType> {
  return new Multieditor<DataType, SubmitReturnType, OnSubmitConfigType>(
    config,
    agileInstance
  );
}
