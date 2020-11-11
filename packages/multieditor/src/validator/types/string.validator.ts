import { ItemKey, Validator } from "../../internal";
import { copy } from "@agile-ts/core";

export class StringValidator<DataType = any> extends Validator<DataType> {
  /**
   * @public
   * String Validator
   * @param validator - Validator
   */
  constructor(validator: Validator<DataType>) {
    super(validator.editor(), { key: validator.key, prefix: "string" });

    // Copy ValidationMethods of old Validator into this Validator
    for (let key in validator.validationMethods) {
      this.validationMethods[key] = copy(validator.validationMethods[key]);
    }
  }

  //=========================================================================================================
  // Max Length
  //=========================================================================================================
  /**
   * @public
   * Checks if the EditorValue has a correct length
   * @param length - maxLength
   */
  public max(length: number): this {
    this.addValidationMethod(
      this.getValidationMethodKey("maxLength"),
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
  public min(length: number): this {
    this.addValidationMethod(
      this.getValidationMethodKey("minLength"),
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
  // Email
  //=========================================================================================================
  /**
   * @public
   * Checks that the EditorValue is a valid Email
   */
  public email(): this {
    this.addValidationMethod(
      this.getValidationMethodKey("email"),
      async (key: ItemKey, value: DataType) => {
        if (typeof value === "string") {
          const emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
          const isValid = emailRegex.test(value.toLowerCase());
          if (!isValid) {
            this.editor().setStatus(key, "error", `${key} is not valid Email`);
          }

          return isValid;
        }
        return false;
      }
    );
    return this;
  }
}
