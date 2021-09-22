import { generateId, isFunction, LogCodeManager } from '@agile-ts/core';
import { defineConfig, isValidObject } from '@agile-ts/utils';
import { ItemKey, Multieditor } from '../multieditor';
import { Item } from '../item';

export class Validator<DataType = any> {
  public _key?: ValidatorKey;
  public config: ValidatorConfigInterface = {};

  // Schemas to validate Items via this Validator
  public validationMethods: {
    [key: string]: ValidationMethodInterface<DataType>;
  } = {};

  /**
   * Class to handle schema validations.
   *
   * @public
   * @param config - Configuration object
   */
  constructor(config: ValidatorConfigInterface = {}) {
    config = defineConfig(config, {
      key: generateId(),
    });
    this._key = config.key;
  }

  /**
   * Updates the key/name identifier of the Validator.
   *
   * @public
   * @param value - New key/name identifier.
   */
  public set key(value: ValidatorKey | undefined) {
    this._key = value;
  }

  /**
   * Returns the key/name identifier of the Validator.
   *
   * @public
   */
  public get key(): ValidatorKey | undefined {
    return this._key;
  }

  /**
   * Validates the specified value
   * and updates the status of the provided Item.
   *
   * @public
   * @param item - Item to apply the validated value to.
   * @param value - Value to be validated.
   */
  public async validate(
    item: Item<DataType>,
    value: DataType
  ): Promise<boolean> {
    let isValid = true;
    if (item == null || item._key == null) return false;
    const editor = item.editor();

    // Reverse validation methods because the first method should have the highest weight
    const validationMethodKeys = Object.keys(this.validationMethods).reverse();

    // Track created Statuses during the Validation Time
    item.status.statusTracker.track();

    // Call validation methods (-> validate Item at specified key)
    for (const validationMethodKey of validationMethodKeys)
      isValid =
        (await this.validationMethods[validationMethodKey](
          item._key,
          value,
          editor
        )) && isValid;

    // Handle tracked Statuses
    const trackedStatuses = item.status.statusTracker.getTrackedStatuses();
    item.status.activeValues = new Set(trackedStatuses);
    if (trackedStatuses.length <= 0) editor.resetStatus(item._key);

    return isValid;
  }

  /**
   * Assigns a new validation method to the Validator.
   *
   * @public
   * @param method - Validation method to be added.
   */
  public addValidationMethod(method: ValidationMethodInterface<DataType>): this;
  /**
   * Assigns a new validation method to the Validator.
   *
   * @public
   * @param key - Key/Name identifier of the to add validation method.
   * @param method - Validation method to be added
   */
  public addValidationMethod(
    key: ValidationMethodKey,
    method: ValidationMethodInterface<DataType>
  ): this;
  public addValidationMethod(
    keyOrMethod: ValidationMethodKey | ValidationMethodInterface<DataType>,
    method?: ValidationMethodInterface<DataType>
  ): this {
    let _method: ValidationMethodInterface<DataType>;
    let key: ValidationMethodKey;

    if (isFunction(keyOrMethod)) {
      key = generateId();
      _method = keyOrMethod as ValidationMethodInterface<DataType>;
    } else {
      key = keyOrMethod as string;
      _method = method as ValidationMethodInterface<DataType>;
    }

    if (!isFunction(_method)) {
      // TODO error
      return this;
    }

    this.validationMethods[key] = _method;

    return this;
  }

  /**
   * Appends the specified Validator to this Validator.
   *
   * @public
   * @param validator - Validator to be appended to this Validator.
   */
  public append(validator: Validator) {
    if (validator === this) {
      // TODO error
      return this;
    }

    // Append validation methods to this Validator
    const toMergeValidationMethodKeys = Object.keys(
      validator.validationMethods
    );
    for (const key of toMergeValidationMethodKeys) {
      if (!this.validationMethods.hasOwnProperty(key)) {
        this.validationMethods[key] = validator.validationMethods[key];
      }
    }

    return this;
  }
}

export type ValidatorKey = string | number;

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
) => Promise<boolean> | boolean;

export type ValidationMethodKey = string | number;

export interface ValidationMethodObjectInterface<DataType = any> {
  name?: string;
  method: ValidationMethodInterface<DataType>;
}
