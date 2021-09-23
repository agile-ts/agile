import { generateId, normalizeArray, isFunction } from '@agile-ts/utils';
import { ValidationMethodInterface, Validator } from '../../validator';

/**
 * Returns a Validator created based on the specified Agile validation methods.
 *
 * @param validationSchemaParts - Agile Validation methods
 */
export function agileResolver(
  ...validationSchemaParts: (
    | ValidationMethodObjectInterface
    // Why supporting such a weired method form?
    // To also support passing the Agile validation method without calling it.
    // Example: agileResolver(isRequired, isString, max(10))
    | (() => ValidationMethodObjectInterface)
  )[]
): Validator {
  const _validationSchemaParts = normalizeArray(validationSchemaParts);
  const validator = new Validator();

  _validationSchemaParts.forEach((validationSchemaPart) => {
    if (typeof validationSchemaPart === 'function')
      validationSchemaPart = validationSchemaPart();

    // Add validation method to the created Validator
    if (
      validationSchemaPart != null &&
      isFunction(validationSchemaPart.method)
    ) {
      validator.addValidationMethod(validationSchemaPart.method, {
        key: `${validationSchemaPart.key ?? generateId()}_${generateId()}`,
      });
    }
  });

  return validator;
}

export interface ValidationMethodObjectInterface<DataType = any> {
  /**
   * Key/name identifier of the specified validation method.
   * @default randomly generated key
   */
  key?: string;
  /**
   * Validation method.
   */
  method: ValidationMethodInterface<DataType>;
}
