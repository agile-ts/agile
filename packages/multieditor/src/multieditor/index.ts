import { Agile, shared } from '@agile-ts/core';
import { defineConfig } from '@agile-ts/utils';
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
  config = defineConfig(config, {
    agileInstance: shared,
  });
  return new Multieditor<DataType, SubmitReturnType, OnSubmitConfigType>(
    config,
    agileInstance as any
  );
}
