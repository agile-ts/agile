import { generateId, normalizeArray } from '@agile-ts/utils';
import { ValidationMethodObjectInterface, Validator } from '../../validator';

export function agileResolver(
  ...validationMethods: (
    | ValidationMethodObjectInterface
    | (() => ValidationMethodObjectInterface)
  )[]
): Validator {
  const _validationMethods = normalizeArray(validationMethods);
  const validator = new Validator();

  _validationMethods.forEach((validationMethod) => {
    if (typeof validationMethod !== 'object') {
      validationMethod = validationMethod();
    }

    validator.addValidationMethod(
      `${validationMethod.name}_${generateId()}`,
      validationMethod.method
    );
  });

  return validator;
}
