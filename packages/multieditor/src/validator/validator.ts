import { generateId, isFunction, LogCodeManager } from '@agile-ts/core';
import { ItemKey, Multieditor } from '../multieditor';
import { defineConfig } from '@agile-ts/utils';

export class Validator<DataType = any> {
  public _key?: ValidatorKey;
  public config: ValidatorConfigInterface = {};

  // Schemas to validate Items via this Validator
  public validationSchemas: {
    [key: string]: ValidationMethodInterface<DataType>;
  } = {};

  /**
   * Validator - Easy way to validate Editor Values
   *
   * @public
   * @param config - Config
   */
  constructor(config: ValidatorConfigInterface = {}) {
    config = defineConfig(config, {
      key: generateId(),
    });
    this._key = config.key;
  }

  /**
   * @public
   * Set Key/Name of Validator
   */
  public set key(value: ValidatorKey | undefined) {
    this._key = value;
  }

  /**
   * @public
   * Get Key/Name of Validator
   */
  public get key(): ValidatorKey | undefined {
    return this._key;
  }

  //=========================================================================================================
  // Validate
  //=========================================================================================================
  /**
   * @public
   * Validates Item Value at Key and updates its Status
   * @param key - Key/Name of Item
   * @param value - Value that gets validated
   * @param editor - MultiEditor that holds the Item which gets validated
   */
  public async validate(
    key: ItemKey,
    value: DataType,
    editor: Multieditor<DataType>
  ): Promise<boolean> {
    let isValid = true;
    const item = editor.getItemById(key);
    if (item == null) return false;

    // Reverse validation methods because the first method should have the highest weight
    const validationMethodKeys = Object.keys(this.validationSchemas).reverse();

    // Track created Statuses during the Validation Time
    item.status.statusTracker.track();

    // Call validation methods (-> validate Item at specified key)
    for (const validationMethodKey of validationMethodKeys)
      isValid =
        (await this.validationSchemas[validationMethodKey](
          key,
          value,
          editor
        )) && isValid;

    // Handle tracked Statuses
    const trackedStatuses = item.status.statusTracker.getTrackedStatuses();
    item.status.activeValues = new Set(trackedStatuses);
    if (trackedStatuses.length <= 0) editor.resetStatus(key);

    return isValid;
  }

  //=========================================================================================================
  // Add Validation Method
  //=========================================================================================================
  /**
   * @public
   * Adds Validation Method to Validator
   * @param method - Validation Method
   */
  public addValidationSchema(
    method: AddValidationMethodMethodType<DataType>
  ): this;
  public addValidationSchema(
    key: ValidationMethodKey,
    method: AddValidationMethodMethodType<DataType>
  ): this;
  public addValidationSchema(
    keyOrMethod: ValidationMethodKey | AddValidationMethodMethodType<DataType>,
    method?: AddValidationMethodMethodType<DataType>
  ): this {
    const generateKey = isFunction(keyOrMethod);
    let validationMethodObject: AddValidationMethodMethodType<DataType>;
    let key: ValidationMethodKey;

    if (generateKey) {
      key = generateId();
      validationMethodObject = keyOrMethod as AddValidationMethodMethodType<
        DataType
      >;
    } else {
      key = keyOrMethod as string;
      validationMethodObject = method as AddValidationMethodMethodType<
        DataType
      >;
    }

    // Resolve validation schema
    // TODO add Yup support via resolvers (https://github.dev/formium/formik/tree/master/packages/formik/src, https://github.com/react-hook-form/resolvers)
    if (typeof validationMethodObject !== 'object') {
      validationMethodObject = validationMethodObject();
    }

    if (!isFunction(validationMethodObject.method)) {
      LogCodeManager.getLogger()?.error(
        'A Validation Method has to be a function!'
      );
      return this;
    }

    this.validationSchemas[key] = validationMethodObject.method;

    return this;
  }
}

export type ValidatorKey = string | number;

export type AddValidationMethodMethodType<DataType = any> =
  | ValidationMethodObjectInterface<DataType>
  | (() => ValidationMethodObjectInterface<DataType>);

/**
 * @param key - Key/Name of Validator
 * @param prefix - Validation Method Prefix
 */
export interface ValidatorConfigInterface {
  key?: ValidatorKey;
}

export type ValidationMethodInterface<DataType = any> = (
  toValidateItemKey: ItemKey,
  value: DataType,
  editor: Multieditor<DataType>
) => boolean;

export type ValidationMethodKey = string | number;

export interface ValidationMethodObjectInterface<DataType = any> {
  name?: string;
  method: ValidationMethodInterface<DataType>;
}
