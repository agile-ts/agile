import { ValidationMethodObjectInterface } from '../resolvers/agile';

export function isNumber(
  errorMessage?: string
): ValidationMethodObjectInterface {
  return {
    key: 'isNumber',
    method: (toValidateItemKey, value, editor): boolean => {
      const isValid = typeof value === 'number';
      if (!isValid) {
        editor.setStatus(
          toValidateItemKey,
          'error',
          errorMessage || `${toValidateItemKey} is no valid Number!`
        );
      }
      return isValid;
    },
  };
}

export function max(
  maxNumber: number,
  errorMessage?: string
): ValidationMethodObjectInterface {
  return {
    key: 'max',
    method: (toValidateItemKey, value, editor): boolean => {
      if (!value || typeof value !== 'number') return false;
      const isValid = value <= maxNumber;
      if (!isValid) {
        editor.setStatus(
          toValidateItemKey,
          'error',
          errorMessage ||
            `${toValidateItemKey} has to be smaller than ${maxNumber}`
        );
      }
      return isValid;
    },
  };
}
