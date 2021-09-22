import { ValidationMethodObjectInterface } from '../resolvers/agile';

export function isRequired(
  errorMessage?: string
): ValidationMethodObjectInterface {
  return {
    key: 'isRequired',
    method: (toValidateItemKey, value, editor): boolean => {
      const isValid = !!value;
      if (!isValid) {
        editor.setStatus(
          toValidateItemKey as any,
          'error',
          errorMessage || `${toValidateItemKey} is a required field`
        );
      }
      return isValid;
    },
  };
}

// TODO add some kind of combined Validator besides the tree shakable validation syntax
// resolveAgile(Validator().required().string().max(10).email());
// ===
// resolveAgile(isRequired, isString, maxLength(10), isEmail)
