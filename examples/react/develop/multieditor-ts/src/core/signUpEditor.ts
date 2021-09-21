import { createMultieditor, Validator } from '@agile-ts/multieditor';
import { generateColor, generateId, isLight } from './utils';
import { globalBind } from '@agile-ts/core';

export const isValidNameValidator = new Validator()
  .required()
  .string()
  .min(2)
  .max(10)
  .matches(/^([^0-9]*)$/, 'No Numbers allowed!')
  .main();

export const signUpEditor = createMultieditor((editor) => ({
  data: {
    id: 'myCoolId',
    firstName: 'Jeff',
    lastName: '',
    gender: undefined,
    userName: '',
    email: '',
    aboutYou: '',
    age: undefined,
    image: {
      id: generateId(),
      color: generateColor(),
    },
  },
  onSubmit: async (preparedData) => {
    alert(JSON.stringify(preparedData));
  },
  validateMethods: {
    firstName: isValidNameValidator,
    lastName: isValidNameValidator,
    userName: isValidNameValidator
      .clone()
      .addValidationMethod(async (key, value, editor) => {
        const isValid = value === 'Jeff';
        if (!isValid)
          editor.setStatus(key, 'error', 'Sry only the name Jeff is allowed!');
        return isValid;
      }),
    email: editor.Validator().required().string().email().main(),
    aboutYou: editor
      .Validator()
      .required()
      .string()
      .min(10)
      .main()
      .addValidationMethod(async (key, value, editor) => {
        const isValid = typeof value === 'string' && !value.includes('fuck');
        if (!isValid)
          editor.setStatus(key, 'error', 'The word fuck is not allowed!');
        return isValid;
      }),
    age: editor.Validator().required().number().min(18).max(100).main(),
    gender: editor.Validator().required(),
    image: editor
      .Validator()
      .required()
      .addValidationMethod(async (key, value, editor) => {
        const isValid = isLight(value.color);
        if (!isValid) editor.setStatus(key, 'error', 'The Image is to dark!');
        return isValid;
      }),
  },
  computeMethods: {
    lastName: (value) => {
      return value && typeof value === 'string' ? value.toUpperCase() : value;
    },
    age: (value) => {
      return Number(value) || value;
    },
  },
  fixedProperties: ['id'],
  reValidateMode: 'afterFirstSubmit',
}));

// For better debugging
globalBind('__core__', { isValidNameValidator, signUpEditor });
