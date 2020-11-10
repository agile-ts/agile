import MultiEditor, { DataObject, ItemKey } from "./index";
import { Agile, generateId, isFunction } from "@agile-ts/core";

export class Validator<DataType = any, SubmitReturnType = void> {
  public agileInstance: () => Agile;

  public _key?: ValidatorKey;
  public validationMethods: DataObject<ValidationMethodInterface> = {};
  public editor: () => MultiEditor<DataType, SubmitReturnType>;

  /**
   * @public
   * Validator - Easy way to tell the Editor conditions which the EditorValue has to follow
   * @param editor - Editor in which this Validator validates Items
   * @param key - Key/Name of Item the Validator validates
   */
  constructor(
    editor: MultiEditor<DataType, SubmitReturnType>,
    key?: ValidatorKey
  ) {
    this.editor = () => editor;
    this.agileInstance = () => editor.agileInstance();
    this._key = key;
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
   * Validates that value Item at Key follow the Validator rules
   * @param key - Key of Item
   * @param value - Value that gets validated
   */
  public async validate(key: ItemKey, value: DataType): Promise<boolean> {
    let isValid = true;
    const item = this.editor().getItemById(key);
    if (!item) return false;

    // Track created Statuses during the validation time
    item._status.trackStatus = true;

    // Call validationMethods
    for (let validationMethodKey in this.validationMethods)
      isValid =
        (await this.validationMethods[validationMethodKey](key, value)) &&
        isValid;

    // Get Tracked Statuses and reset if no Status got set during the validation Time
    const foundStatuses = item._status.getTrackedStatuses();
    if (foundStatuses.size <= 0) this.editor().resetStatus(key);

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
      console.error("Agile: A Validation Method has to be an function!");
      return this;
    }

    // Check if Validation Method already exists
    if (this.validationMethods[key]) {
      console.error(
        `Agile: Validation Method with the key/name ${key} already exists!`
      );
      return this;
    }

    this.validationMethods[key] = _method;
    return this;
  }

  //=========================================================================================================
  // Max Length
  //=========================================================================================================
  /**
   * @public
   * Checks if the EditorValue has a correct length
   * @param length - maxLength
   */
  public maxLength(length: number): this {
    this.addValidationMethod(
      "maxLength",
      async (key: ItemKey, value: DataType) => {
        if (!value) return false;
        if (Array.isArray(value) || typeof value === "string") {
          const isValid = value.length <= length;
          if (!isValid) {
            this.editor().setStatus(
              key,
              "error",
              `${key} needs max ${length} length`
            );
          }

          return isValid;
        }

        console.warn(
          "Agile: Using maxLength on a none Array/String Input won't work"
        );
        return true;
      }
    );
    return this;
  }

  //=========================================================================================================
  // Min Length
  //=========================================================================================================
  /**
   * @public
   * Checks if the EditorValue has a correct length
   * @param length - minLength
   */
  public minLength(length: number): this {
    this.addValidationMethod(
      "minLength",
      async (key: ItemKey, value: DataType) => {
        if (!value) return false;
        if (Array.isArray(value) || typeof value === "string") {
          const isValid = value.length >= length;
          if (!isValid) {
            this.editor().setStatus(
              key,
              "error",
              `${key} needs min ${length} length`
            );
          }

          return isValid;
        }

        console.warn(
          "Agile: Using minLength on a none Array/String Input won't work"
        );
        return true;
      }
    );
    return this;
  }

  //=========================================================================================================
  // Required
  //=========================================================================================================
  /**
   * @public
   * Checks that the EditorValue exists
   */
  public required(): this {
    this.addValidationMethod(
      "required",
      async (key: ItemKey, value: DataType) => {
        const isValid = !!value;
        if (!isValid) {
          this.editor().setStatus(key, "error", `${key} has to exist`);
        }

        return isValid;
      }
    );
    return this;
  }

  //=========================================================================================================
  // Email
  //=========================================================================================================
  /**
   * @public
   * Checks that the EditorValue is a valid Email
   */
  public email(): this {
    this.addValidationMethod("email", async (key: ItemKey, value: DataType) => {
      if (typeof value === "string") {
        const emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        const isValid = emailRegex.test(value.toLowerCase());
        if (!isValid) {
          this.editor().setStatus(key, "error", `${key} is not valid Email`);
        }

        return isValid;
      }
      return false;
    });
    return this;
  }
}

export type ValidatorKey = string | number;
export type ValidationMethodInterface<DataType = any> = (
  key: ItemKey,
  value: DataType
) => Promise<boolean>;
