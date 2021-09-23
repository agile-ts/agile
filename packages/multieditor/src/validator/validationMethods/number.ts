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
          errorMessage || `${toValidateItemKey} must be a valid number`
        );
      }
      return isValid;
    },
  };
}

export function maxNumber(
  maxNumber: number,
  errorMessage?: string
): ValidationMethodObjectInterface {
  return {
    key: 'maxNumber',
    method: (toValidateItemKey, value, editor): boolean => {
      if (value == null || typeof value !== 'number') return false;
      const isValid = value <= maxNumber;
      if (!isValid) {
        editor.setStatus(
          toValidateItemKey,
          'error',
          errorMessage ||
            `${toValidateItemKey} must be smaller than ${maxNumber}`
        );
      }
      return isValid;
    },
  };
}

export function minNumber(
  minNumber: number,
  errorMessage?: string
): ValidationMethodObjectInterface {
  return {
    key: 'minNumber',
    method: (toValidateItemKey, value, editor): boolean => {
      if (value == null || typeof value !== 'number') return false;
      const isValid = value >= minNumber;
      if (!isValid) {
        editor.setStatus(
          toValidateItemKey,
          'error',
          errorMessage ||
            `${toValidateItemKey} must be larger than ${minNumber}`
        );
      }
      return isValid;
    },
  };
}

export function isPositiveNumber(
  errorMessage?: string
): ValidationMethodObjectInterface {
  return {
    key: 'positiveNumber',
    method: (toValidateItemKey, value, editor): boolean => {
      if (value == null || typeof value !== 'number') return false;
      const isValid = value >= 0;
      if (!isValid) {
        editor.setStatus(
          toValidateItemKey,
          'error',
          errorMessage || `${toValidateItemKey} must be a positive number`
        );
      }
      return isValid;
    },
  };
}

export function isNegativeNumber(
  errorMessage?: string
): ValidationMethodObjectInterface {
  return {
    key: 'negativeNumber',
    method: (toValidateItemKey, value, editor): boolean => {
      if (value == null || typeof value !== 'number') return false;
      const isValid = value < 0;
      if (!isValid) {
        editor.setStatus(
          toValidateItemKey,
          'error',
          errorMessage || `${toValidateItemKey} must be a negative number`
        );
      }
      return isValid;
    },
  };
}
