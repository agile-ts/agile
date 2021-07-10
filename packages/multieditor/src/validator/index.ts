import { copy, generateId, isFunction, LogCodeManager } from '@agile-ts/core';
import {
  DataObject,
  MultiEditor,
  ItemKey,
  StringValidator,
  NumberValidator,
} from '../internal';

export class Validator<DataType = any> {
  public _key?: ValidatorKey;
  public config: ValidatorConfigInterface = {};
  public validationMethods: DataObject<ValidationMethodInterface> = {};

  /**
   * @public
   * Validator - Easy way to validate Editor Values
   * @param config - Config
   */
  constructor(config: ValidatorConfigInterface = {}) {
    this.config = {
      prefix: 'default',
      ...config,
    };
    this._key = this.config.key;
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
    editor: MultiEditor<DataType>
  ): Promise<boolean> {
    let isValid = true;
    const item = editor.getItemById(key);
    if (!item) return false;

    // Reverse because the first validation Method should have the highest weight (needs to be called as last to overwrite the Status)
    const validationMethodKeys = Object.keys(this.validationMethods).reverse();

    // Track created Statuses during the Validation Time
    item.status.track = true;

    // Call validationMethods (Validation Time)
    for (const validationMethodKey of validationMethodKeys)
      isValid =
        (await this.validationMethods[validationMethodKey](
          key,
          value,
          editor
        )) && isValid;

    // Handle tracked Statuses
    const foundStatuses = item.status.getTrackedValues();
    item.status.activeValues = new Set(foundStatuses);
    if (foundStatuses.size <= 0) editor.resetStatus(key);

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
  public addValidationMethod(method: ValidationMethodInterface<DataType>): this;
  /**
   * @public
   * Adds Validation Method to Validator
   * @param key - Key of Validation Method
   * @param method - Validation Method
   */
  public addValidationMethod(
    key: ItemKey,
    method: ValidationMethodInterface<DataType>
  ): this;
  public addValidationMethod(
    keyOrMethod: ItemKey | ValidationMethodInterface<DataType>,
    method?: ValidationMethodInterface<DataType>
  ): this {
    const generateKey = isFunction(keyOrMethod);
    let _method: ValidationMethodInterface<DataType>;
    let key: ItemKey;

    if (generateKey) {
      key = generateId();
      _method = keyOrMethod as ValidationMethodInterface<DataType>;
    } else {
      key = keyOrMethod as string;
      _method = method as ValidationMethodInterface<DataType>;
    }

    // Check if Validation Method is a Function
    if (!isFunction(_method)) {
      LogCodeManager.getLogger()?.error(
        'A Validation Method has to be a function!'
      );
      return this;
    }

    // Check if Validation Method already exists
    if (this.validationMethods[key]) {
      LogCodeManager.getLogger()?.error(
        `Validation Method with the key/name '${key}' already exists!`
      );
      return this;
    }

    this.validationMethods[key] = _method;
    return this;
  }

  //=========================================================================================================
  // String
  //=========================================================================================================
  /**
   * @public
   * Get String Validator
   */
  public string(): StringValidator<DataType> {
    return new StringValidator<DataType>(this);
  }

  //=========================================================================================================
  // Number
  //=========================================================================================================
  /**
   * @public
   * Get Number Validator
   */
  public number(): NumberValidator<DataType> {
    return new NumberValidator<DataType>(this);
  }

  //=========================================================================================================
  // Clone
  //=========================================================================================================
  /**
   * @public
   * Get a fresh clone of this Validator
   */
  public clone(): Validator<DataType> {
    const clone = new Validator<DataType>();
    clone.validationMethods = copy(this.validationMethods);
    clone._key = this._key;
    clone.config = copy(this.config);
    return clone;
  }

  //=========================================================================================================
  // Required
  //=========================================================================================================
  /**
   * @public
   * Checks if the Editor Value exists
   * @param errorMessage - Error Message
   */
  public required(errorMessage?: string): this {
    this.addValidationMethod(
      this.getValidationMethodKey('required'),
      async (key: ItemKey, value: DataType, editor) => {
        const isValid = !!value;
        if (!isValid) {
          editor.setStatus(
            key,
            'error',
            errorMessage || `${key} is a required field`
          );
        }
        return isValid;
      }
    );
    return this;
  }

  //=========================================================================================================
  // Get Validation Method Key
  //=========================================================================================================
  /**
   * @internal
   * Creates Validation Method Key from provided key
   * @param key - Key that gets converted into a Validation Method Key
   */
  public getValidationMethodKey(key: string): string {
    return `_${this.config.prefix}_${key}`;
  }
}

export type ValidatorKey = string | number;
export type ValidationMethodInterface<DataType = any> = (
  key: ItemKey,
  value: DataType,
  editor: MultiEditor<DataType>
) => Promise<boolean>;

/**
 * @param key - Key/Name of Validator
 * @param prefix - Validation Method Prefix
 */
export interface ValidatorConfigInterface {
  key?: ValidatorKey;
  prefix?: string;
}
