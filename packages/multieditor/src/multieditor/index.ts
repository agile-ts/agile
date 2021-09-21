import { Agile, shared } from '@agile-ts/core';
import { EditorConfig, Multieditor } from './multieditor';

export * from './multieditor';

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
