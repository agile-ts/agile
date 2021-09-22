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

export function maxLength(
  maxLength: number,
  errorMessage?: string
): ValidationMethodObjectInterface {
  return {
    key: 'maxLength',
    method: (toValidateItemKey, value, editor): boolean => {
      if (value == null || typeof value !== 'string') return false;
      const isValid = value.length <= maxLength;
      if (!isValid) {
        editor.setStatus(
          toValidateItemKey,
          'error',
          errorMessage ||
            `${toValidateItemKey} needs at least ${maxLength} characters`
        );
      }
      return isValid;
    },
  };
}

export function minLength(
  minLength: number,
  errorMessage?: string
): ValidationMethodObjectInterface {
  return {
    key: 'minLength',
    method: (toValidateItemKey, value, editor): boolean => {
      if (value == null || typeof value !== 'string') return false;
      const isValid = value.length >= minLength;
      if (!isValid) {
        editor.setStatus(
          toValidateItemKey,
          'error',
          errorMessage ||
            `${toValidateItemKey} needs at least ${minLength} characters`
        );
      }
      return isValid;
    },
  };
}

export function isEmail(
  errorMessage?: string
): ValidationMethodObjectInterface {
  return {
    key: 'isEmail',
    method: (toValidateItemKey, value, editor): boolean => {
      if (value == null || typeof value !== 'string') return false;
      const emailRegex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
      const isValid = emailRegex.test(value.toLowerCase());
      if (!isValid) {
        editor.setStatus(
          toValidateItemKey,
          'error',
          errorMessage || `${toValidateItemKey} is no valid email`
        );
      }
      return isValid;
    },
  };
}

export function isUrl(errorMessage?: string): ValidationMethodObjectInterface {
  return {
    key: 'isUrl',
    method: (toValidateItemKey, value, editor): boolean => {
      if (value == null || typeof value !== 'string') return false;
      const urlRegex = /[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)?/gi;
      const isValid = urlRegex.test(value.toLowerCase());
      if (!isValid) {
        editor.setStatus(
          toValidateItemKey,
          'error',
          errorMessage || `${toValidateItemKey} is no valid url`
        );
      }
      return isValid;
    },
  };
}

export function matchesRegex(
  regex: RegExp,
  errorMessage?: string
): ValidationMethodObjectInterface {
  return {
    key: 'matchesRegex',
    method: (toValidateItemKey, value, editor): boolean => {
      if (value == null || typeof value !== 'string') return false;
      const isValid = regex.test(value.toLowerCase());
      if (!isValid) {
        editor.setStatus(
          toValidateItemKey,
          'error',
          errorMessage || `${toValidateItemKey} doesn't follow defined regex`
        );
      }
      return isValid;
    },
  };
}
