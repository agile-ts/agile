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
            `${toValidateItemKey} has to be smaller than ${maxNumber}`
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
            `${toValidateItemKey} has to be smaller than ${minNumber}`
        );
      }
      return isValid;
    },
  };
}

export function positiveNumber(
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
          errorMessage || `${toValidateItemKey} has to be positive`
        );
      }
      return isValid;
    },
  };
}

export function negativeNumber(
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
          errorMessage || `${toValidateItemKey} has to be negative`
        );
      }
      return isValid;
    },
  };
}
