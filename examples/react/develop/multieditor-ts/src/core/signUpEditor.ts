import {
  agileResolver,
  createMultieditor,
  isEmail,
  isNumber,
  isRequired,
  isString,
  matchesRegex,
  maxLength,
  maxNumber,
  minLength,
  minNumber,
  yupResolver,
} from '@agile-ts/multieditor';
import { globalBind } from '@agile-ts/core';
import * as Yup from 'yup';
import { generateColor, generateId, isLight } from './utils';

export const isValidNameValidator = agileResolver(
  isRequired,
  isString,
  minLength(2),
  maxLength(10),
  matchesRegex(/^([^0-9]*)$/, 'No Numbers allowed!')
);

export const signUpEditor = createMultieditor((editor) => ({
  initialData: {
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
  validationSchema: {
    // Outsourced Validator
    firstName: isValidNameValidator,

    // Validation with Yup
    lastName: yupResolver(
      Yup.string()
        .min(2)
        .max(10)
        .matches(/^([^0-9]*)$/, 'No Numbers allowed!')
    ),

    // Outsourced Validator with additional validation method
    userName: isValidNameValidator.addValidationMethod(
      async (key, value, editor) => {
        const isValid = value === 'Jeff';
        if (!isValid)
          editor.setStatus(key, 'error', 'Sry only the name Jeff is allowed!');
        return isValid;
      }
    ),

    // Validation with Agile
    email: agileResolver(isRequired, isString, isEmail),

    // Validation with Yup and Agile
    aboutYou: agileResolver(isRequired)
      .append(yupResolver(Yup.string().min(10)))
      .addValidationMethod(async (key, value, editor) => {
        const isValid = typeof value === 'string' && !value.includes('fuck');
        if (!isValid)
          editor.setStatus(key, 'error', 'The word fuck is not allowed!');
        return isValid;
      }),
    age: agileResolver(isRequired, isNumber, minNumber(18), maxNumber(100)),

    gender: agileResolver(isRequired),

    image: agileResolver(isRequired).addValidationMethod(
      async (key, value, editor) => {
        const isValid = isLight(value.color);
        if (!isValid) editor.setStatus(key, 'error', 'The Image is to dark!');
        return isValid;
      }
    ),
  },
  fixedProperties: ['id'],
  reValidateMode: 'onChange',
}));

// For better debugging
globalBind('__core__', { signUpEditor });
