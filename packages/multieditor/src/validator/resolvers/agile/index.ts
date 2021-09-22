import { generateId, normalizeArray } from '@agile-ts/utils';
import { ValidationMethodInterface, Validator } from '../../validator';
import { isFunction } from '@agile-ts/core';

/**
 * Returns a validator created based on the specified Agile validation methods.
 *
 * @param validationMethods - Validation methods.
 */
export function agileResolver(
  ...validationMethods: (
    | ValidationMethodObjectInterface
    // Why supporting such weired method form?
    // To also support passing the Agile validation method without calling it.
    // Example: agileResolver(isRequired, isString, max(10))
    | (() => ValidationMethodObjectInterface)
  )[]
): Validator {
  const _validationMethods = normalizeArray(validationMethods);
  const validator = new Validator();

  _validationMethods.forEach((validationMethod) => {
    if (typeof validationMethod !== 'object') {
      validationMethod = validationMethod();
    }

    // Add validation method to the created Validator
    if (validationMethod != null && isFunction(validationMethod.method)) {
      validator.addValidationMethod(
        `${validationMethod.key ?? generateId()}_${generateId()}`,
        validationMethod.method
      );
    }
  });

  return validator;
}

export interface ValidationMethodObjectInterface<DataType = any> {
  /**
   * Key/name identifier of the specified method.
   * @default randomly generated key
   */
  key?: string;
  /**
   * Validation method.
   */
  method: ValidationMethodInterface<DataType>;
}
