import { generateId, isFunction, defineConfig, copy } from '@agile-ts/utils';
import { ItemKey, Multieditor } from '../multieditor';
import { Item } from '../item';
import { LogCodeManager } from '../logCodeManager';

export class Validator<DataType = any> {
  public config: ValidatorConfigInterface = {};

  // Key/Name identifier of the Validator
  public _key?: ValidatorKey;

  // Methods that a value must pass in order to be 'valid'
  public validationMethods: ValidationMethodContainerInterface<DataType>[] = [];

  /**
   * Handles the validation of Items.
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
   * and updates the Status of the provided Item.
   *
   * @public
   * @param item - Item to apply the computed status to.
   * @param value - Value to be validated.
   */
  public async validate(
    item: Item<DataType>,
    value: DataType
  ): Promise<boolean> {
    let isValid = true;
    if (item == null || item._key == null) return false;
    const editor = item.editor();

    // Track updated Statuses during the validation time
    item.status.statusTracker.track();

    // Call validation methods with the specified value
    for (const validationMethod of this.validationMethods)
      isValid =
        (await validationMethod.method(item._key, value, editor)) && isValid;

    // Handle tracked Statuses
    const trackedStatuses = item.status.statusTracker.getTrackedStatuses();
    if (trackedStatuses.length <= 0) editor.resetStatus(item._key);

    return isValid;
  }

  /**
   * Assigns a new validation method to the Validator.
   *
   * @public
   * @param method - Validation method to be added.
   * @param config = Configuration object
   */
  public addValidationMethod(
    method: ValidationMethodInterface<DataType>,
    config: AddValidationMethodConfigInterface = {}
  ): this {
    if (!isFunction(method)) {
      LogCodeManager.log('41:03:00');
      return this;
    }
    this.validationMethods.unshift({ key: config.key, method });
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
      LogCodeManager.log('41:03:01');
      return this;
    }

    // Append validation methods to this Validator
    this.validationMethods.concat(validator.validationMethods);

    return this;
  }

  /**
   * Returns a fresh reference free copy of this Validator.
   *
   * @public
   */
  public copy(): Validator<DataType> {
    const newValidator = new Validator<DataType>({ key: this._key });
    newValidator.validationMethods = copy(this.validationMethods);
    newValidator.config = copy(this.config);
    return newValidator;
  }
}

export type ValidatorKey = string | number;

export interface ValidatorConfigInterface {
  /**
   * Key/Name identifier of the Validator.
   * @default undefined
   */
  key?: ValidatorKey;
}

export type ValidationMethodInterface<DataType = any> = (
  /**
   * Key/Name identifier of the Item whose value to be validated.
   */
  toValidateItemKey: ItemKey,
  /**
   * Value to be validated.
   */
  value: DataType,
  /**
   * Multieditor the to validate Item belongs to.
   */
  editor: Multieditor<DataType>
) => Promise<boolean> | boolean;

export interface ValidationMethodContainerInterface<DataType = any> {
  /**
   * Key/Name identifier of the validation method.
   * @default undefined
   */
  key?: string;
  /**
   * Validation method
   */
  method: ValidationMethodInterface<DataType>;
}

export interface AddValidationMethodConfigInterface {
  /**
   * Key/Name identifier of the validation method.
   * @default undefined
   */
  key?: string;
}

export type ValidationMethodKey = string | number;
