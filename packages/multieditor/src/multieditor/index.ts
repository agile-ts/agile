import { Agile, shared } from '@agile-ts/core';
import { defineConfig } from '@agile-ts/utils';
import { EditorConfig, MultiEditor } from './multieditor';

export * from './multieditor';

export function createMultieditor<
  DataType = any,
  SubmitReturnType = void,
  OnSubmitConfigType = any
>(
  config: EditorConfig<DataType, SubmitReturnType, OnSubmitConfigType>,
  agileInstance: Agile = shared
): MultiEditor<DataType, SubmitReturnType, OnSubmitConfigType> {
  config = defineConfig(config, {
    agileInstance: shared,
  });
  return new MultiEditor<DataType, SubmitReturnType, OnSubmitConfigType>(
    config,
    agileInstance as any
  );
}
