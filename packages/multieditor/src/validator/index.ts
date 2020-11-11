import { Agile, defineConfig, generateId, isFunction } from "@agile-ts/core";
import { DataObject, MultiEditor, ItemKey, StringValidator } from "../internal";

export class Validator<DataType = any> {
  public agileInstance: () => Agile;

  public _key?: ValidatorKey;
  public config: ValidatorConfigInterface = {};
  public validationMethods: DataObject<ValidationMethodInterface> = {};
  public editor: () => MultiEditor<DataType>;

  /**
   * @public
   * Validator - Easy way to tell a Editor Value which conditions it has to follow to be valid
   * @param editor - Editor to that the Validator belongs
   * @param config - Config
   */
  constructor(
    editor: MultiEditor<DataType>,
    config: ValidatorConfigInterface = {}
  ) {
    this.editor = () => editor;
    this.agileInstance = () => editor.agileInstance();
    this.config = defineConfig(config, {
      prefix: "default",
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

  //=========================================================================================================
  // Validate
  //=========================================================================================================
  /**
   * @public
   * Validates Item Value at Key and updates its Status
   * @param key - Key/Name of Item
   * @param value - Value that gets validated
   */
  public async validate(key: ItemKey, value: DataType): Promise<boolean> {
    let isValid = true;
    const item = this.editor().getItemById(key);
    if (!item) return false;

    // Track created Statuses during the Validation Time
    item.status.track = true;

    // Call validationMethods (Validation Time)
    for (let validationMethodKey in this.validationMethods)
      isValid =
        (await this.validationMethods[validationMethodKey](key, value)) &&
        isValid;

    // Handle tracked Statuses
    const foundStatuses = item.status.getTrackedValues();
    item.status.activeValues = new Set(foundStatuses);
    if (foundStatuses.size <= 0) this.editor().resetStatus(key);

    // Logging
    if (this.agileInstance()) {
      console.log(
        `Agile: Validated Key '${key}' in Editor '${this.editor().key}'`,
        isValid
      );
    }

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
      console.error("Agile: A Validation Method has to be a function!");
      return this;
    }

    // Check if Validation Method already exists
    if (this.validationMethods[key]) {
      console.error(
        `Agile: Validation Method with the key/name '${key}' already exists!`
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
  // Required
  //=========================================================================================================
  /**
   * @public
   * Checks that the EditorValue exists
   * @param errorMessage - Error Message
   */
  public required(errorMessage?: string): this {
    this.addValidationMethod(
      this.getValidationMethodKey("required"),
      async (key: ItemKey, value: DataType) => {
        const isValid = !!value;
        if (!isValid) {
          this.editor().setStatus(
            key,
            "error",
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
  value: DataType
) => Promise<boolean>;

/**
 * @param key - Key/Name of Validator
 * @param prefix - Validation Method Prefix
 */
export interface ValidatorConfigInterface {
  key?: ValidatorKey;
  prefix?: string;
}
