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
  DataObjectType extends Object = { [key: string]: any },
  SubmitReturnType = void,
  OnSubmitConfigType = any
>(
  config: EditorConfig<DataObjectType, SubmitReturnType, OnSubmitConfigType>,
  agileInstance: Agile = shared
): Multieditor<DataObjectType, SubmitReturnType, OnSubmitConfigType> {
  return new Multieditor<DataObjectType, SubmitReturnType, OnSubmitConfigType>(
    config,
    agileInstance
  );
}
