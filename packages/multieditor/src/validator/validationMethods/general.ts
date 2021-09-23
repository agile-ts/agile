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
