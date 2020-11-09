import MultiEditor, { DataObject } from "./index";
import { generateId, isFunction } from "@agile-ts/core";

export class Validator<DataType = any, SubmitReturnType = void> {
  public _key?: ValidatorKey;
  public validationMethods: DataObject<ValidationMethodInterface> = {};
  public editor: MultiEditor<DataType, SubmitReturnType>;

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
    this.editor = editor;
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
  public async validate(key: string, value: DataType): Promise<boolean> {
    let isValid = true;

    // Call validationMethods
    for (let validationMethodKey in this.validationMethods)
      isValid =
        (await this.validationMethods[validationMethodKey](key, value)) &&
        isValid;

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
   */
  public addValidationMethod(
    key: string,
    method: ValidationMethodInterface<DataType>
  ): this;
  public addValidationMethod(
    keyOrMethod: string | ValidationMethodInterface<DataType>,
    method?: ValidationMethodInterface<DataType>
  ): this | string {
    const generateKey = isFunction(keyOrMethod);
    let _method: ValidationMethodInterface<DataType>;
    let key: string;

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
      async (key: string, value: DataType) => {
        if (Array.isArray(value) || typeof value === "string") {
          const isValid = value.length <= length;
          if (!isValid) {
            this.editor.setStatus(
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
      async (key: string, value: DataType) => {
        if (Array.isArray(value) || typeof value === "string") {
          const isValid = value.length >= length;
          if (!isValid) {
            this.editor.setStatus(
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
      async (key: string, value: DataType) => {
        const isValid = !!value;
        if (!isValid) {
          this.editor.setStatus(key, "error", `${key} has to exist`);
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
    this.addValidationMethod("email", async (key: string, value: DataType) => {
      if (typeof value === "string") {
        const emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        const isValid = emailRegex.test(value.toLowerCase());
        if (!isValid) {
          this.editor.setStatus(key, "error", `${key} is no valid Email`);
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
  key: string,
  value: DataType
) => Promise<boolean>;
