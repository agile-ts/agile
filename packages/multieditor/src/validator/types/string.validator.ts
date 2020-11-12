import { Validator } from "../../internal";
import { copy } from "@agile-ts/core";

export class StringValidator<DataType = any> extends Validator<DataType> {
  /**
   * @public
   * String Validator
   * @param validator - Validator
   */
  constructor(validator: Validator<DataType>) {
    super({ key: validator.key, prefix: "string" });

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
   * Checks if Editor Value is to long
   * @param length - max Length
   * @param errorMessage - Error Message
   */
  public max(length: number, errorMessage?: string): this {
    this.addValidationMethod(
      this.getValidationMethodKey("maxLength"),
      async (key, value, editor) => {
        if (!value || typeof value !== "string") return false;
        const isValid = value.length <= length;
        if (!isValid) {
          editor.setStatus(
            key,
            "error",
            errorMessage || `${key} has more than ${length} characters`
          );
        }
        return isValid;
      }
    );
    return this;
  }

  //=========================================================================================================
  // Min Length
  //=========================================================================================================
  /**
   * @public
   * Checks if Editor Value is to short
   * @param length - min Length
   * @param errorMessage - Error Message
   */
  public min(length: number, errorMessage?: string): this {
    this.addValidationMethod(
      this.getValidationMethodKey("minLength"),
      async (key, value, editor) => {
        if (!value || typeof value !== "string") return false;
        const isValid = value.length >= length;
        if (!isValid) {
          editor.setStatus(
            key,
            "error",
            errorMessage || `${key} needs at least ${length} characters`
          );
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
   * Checks that the Editor Value is a valid Email
   * @param errorMessage - Error Message
   */
  public email(errorMessage?: string): this {
    this.addValidationMethod(
      this.getValidationMethodKey("email"),
      async (key, value, editor) => {
        if (!value || typeof value !== "string") return false;
        const emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        const isValid = emailRegex.test(value.toLowerCase());
        if (!isValid) {
          editor.setStatus(
            key,
            "error",
            errorMessage || `${key} is no valid email`
          );
        }
        return isValid;
      }
    );
    return this;
  }

  //=========================================================================================================
  // Url
  //=========================================================================================================
  /**
   * @public
   * Checks that the Editor Value is a valid Url
   * @param errorMessage - Error Message
   */
  public url(errorMessage?: string): this {
    this.addValidationMethod(
      this.getValidationMethodKey("email"),
      async (key, value, editor) => {
        if (!value || typeof value !== "string") return false;
        const urlRegex = /[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)?/gi;
        const isValid = urlRegex.test(value.toLowerCase());
        if (!isValid) {
          editor.setStatus(
            key,
            "error",
            errorMessage || `${key} is no valid url`
          );
        }
        return isValid;
      }
    );
    return this;
  }

  //=========================================================================================================
  // Regex
  //=========================================================================================================
  /**
   * @public
   * Checks that the Editor Value matches a specific Regex
   * @param regex - Regex the Value should match
   * @param errorMessage - Error Message
   */
  public matches(regex: RegExp, errorMessage?: string): this {
    this.addValidationMethod(async (key, value, editor) => {
      if (!value || typeof value !== "string") return false;
      const isValid = regex.test(value.toLowerCase());
      if (!isValid) {
        editor.setStatus(
          key,
          "error",
          errorMessage || `${key} doesn't follow defined regex`
        );
      }
      return isValid;
    });
    return this;
  }
}
