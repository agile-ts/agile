import {
  copy,
  generateId,
  isFunction,
  LogCodeManager,
  defineConfig,
} from '@agile-ts/core';
import { DataObject, ItemKey, Multieditor } from '../multieditor';
import { normalizeArray } from '@agile-ts/utils';

export class Validator<DataType = any> {
  public _key?: ValidatorKey;
  public config: ValidatorConfigInterface = {};
  public validationMethods: DataObject<ValidationMethodInterface<DataType>> =
    {};

  /**
   * @public
   * Validator - Easy way to validate Editor Values
   * @param config - Config
   */
  constructor(config: ValidatorConfigInterface = {}) {
    this.config = defineConfig(config, {
      prefix: 'default',
    });
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

  public async validate(
    key: ItemKey,
    value: DataType,
    editor: Multieditor<DataType>
  ): Promise<boolean> {
    let isValid = true;
    const item = editor.getItemById(key);
    if (item == null) return false;

    // Reverse validation methods because the first method should have the highest weight
    const validationMethodKeys = Object.keys(this.validationMethods).reverse();

    // Track created Statuses during the Validation Time
    item.status.statusTracker.track();

    // Call validation methods (-> validate Item at specified key)
    for (const validationMethodKey of validationMethodKeys)
      isValid =
        (await this.validationMethods[validationMethodKey]({
          key,
          value,
          editor,
        })) && isValid;

    // Handle tracked Statuses
    const trackedStatuses = item.status.statusTracker.getTrackedStatuses();
    item.status.activeValues = new Set(trackedStatuses);
    if (trackedStatuses.length <= 0) editor.resetStatus(key);

    return isValid;
  }

  public addValidationMethod(method: ValidationMethodInterface<DataType>): this;
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

    this.validationMethods[key] = _method;

    return this;
  }

  public registerValidationMethods(
    validationMethods: ValidationMethodInterface[] | ValidationMethodInterface
  ): this {
    const _validationMethods = normalizeArray(validationMethods);
    _validationMethods.forEach((validatorMethod) => {
      this.addValidationMethod(generateId(), validatorMethod);
    });
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
  prefix?: string;
}

export type ValidationMethodInterface<DataType = any> = (
  config: ValidatorMethodConfigInterface<DataType>
) => boolean;

export interface ValidatorMethodConfigInterface<DataType = any> {
  key?: ItemKey;
  value: DataType;
  editor: Multieditor<DataType>;
  errorMessage?: string;
}
