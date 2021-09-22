import { ValidationMethodObjectInterface } from '../validator';

export function isString(
  errorMessage?: string
): ValidationMethodObjectInterface {
  return {
    name: 'isString',
    method: (toValidateItemKey, value, editor): boolean => {
      const isValid = typeof value === 'string';
      if (!isValid) {
        editor.setStatus(
          toValidateItemKey,
          'error',
          errorMessage || `${toValidateItemKey} is no valid String!`
        );
      }
      return isValid;
    },
  };
}
