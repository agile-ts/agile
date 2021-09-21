import { ValidatorMethodConfigInterface } from '../validator';
import { defineConfig } from '@agile-ts/core';

export async function isRequired<DataType = any>(
  config: ValidatorMethodConfigInterface<DataType>
) {
  config = defineConfig(config, {
    key: 'isRequired',
    errorMessage: `${config.key} is a required field`,
  });

  const isValid = !!config.value;

  if (!isValid) {
    config.editor.setStatus(
      config.key as any,
      'error',
      config.errorMessage as any
    );
  }

  return isValid;
}
