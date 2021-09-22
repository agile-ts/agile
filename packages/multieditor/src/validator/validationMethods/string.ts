import { ValidationMethodObjectInterface } from '../resolvers/agile';

export function isString(
  errorMessage?: string
): ValidationMethodObjectInterface {
  return {
    key: 'isString',
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
