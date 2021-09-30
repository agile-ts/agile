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
import { assignSharedLogger, createLogger, Logger } from '@agile-ts/logger';

assignSharedLogger(createLogger({ level: Logger.level.DEBUG }));

export const isValidNameValidator = agileResolver(
  isRequired,
  isString,
  minLength(2),
  maxLength(10),
  matchesRegex(/^([^0-9]*)$/, 'No Numbers allowed!')
);

export interface InitialDataInterface {
  id: string;
  firstName: string;
  lastName: string;
  gender: string | undefined;
  userName: string;
  email: string;
  age: number | undefined;
  aboutYou: string;
  image: {
    id: string;
    color: string;
  };
}

export const signUpEditor = createMultieditor<InitialDataInterface>({
  initialData: {
    id: 'myCoolId',
    firstName: 'Jeff',
    lastName: '',
    gender: undefined,
    userName: '',
    email: '',
    age: undefined,
    aboutYou: '',
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
        .required()
        .min(2)
        .max(10)
        .matches(/^([^0-9]*)$/, 'No Numbers allowed!')
    ),

    // Outsourced Validator with additional validation method
    userName: isValidNameValidator
      .copy()
      .addValidationMethod(async (key, value, editor) => {
        const isValid = value === 'Jeff';
        if (!isValid)
          editor.setStatus(key, 'error', 'Sry only the name Jeff is allowed!');
        return isValid;
      }),

    // Validation with Agile
    email: agileResolver(isRequired, isString, isEmail),

    age: agileResolver(isRequired, isNumber, minNumber(18), maxNumber(100)),

    // Validation with Yup and Agile
    aboutYou: agileResolver(isRequired)
      .append(yupResolver(Yup.string().min(10)))
      .addValidationMethod(async (key, value, editor) => {
        const isValid = typeof value === 'string' && !value.includes('fuck');
        if (!isValid)
          editor.setStatus(key, 'error', 'The word fuck is not allowed!');
        return isValid;
      }),

    gender: agileResolver(isRequired),

    image: agileResolver(isRequired).addValidationMethod(
      async (key, value, editor) => {
        const isValid = isLight(value.color);
        if (!isValid) editor.setStatus(key, 'error', 'The Image is to dark!');
        return isValid;
      }
    ),
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
  reValidateMode: 'onBlur',
});

// For better debugging
globalBind('__core__', { signUpEditor });
