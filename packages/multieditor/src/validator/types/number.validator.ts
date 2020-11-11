import { Validator } from "../../internal";
import { copy } from "@agile-ts/core";

export class NumberValidator<DataType = any> extends Validator<DataType> {
  /**
   * @public
   * Number Validator
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
  // Max Number
  //=========================================================================================================
  /**
   * @public
   * Checks if Editor Value is to large
   * @param number - max Number
   * @param errorMessage - Error Message
   */
  public max(number: number, errorMessage?: string): this {
    this.addValidationMethod(
      this.getValidationMethodKey("maxNumber"),
      async (key, value) => {
        if (!value || typeof value !== "number") return false;
        const isValid = number <= value;
        if (!isValid) {
          this.editor().setStatus(
            key,
            "error",
            errorMessage || `${key} has to be smaller than ${number}`
          );
        }
        return isValid;
      }
    );
    return this;
  }

  //=========================================================================================================
  // Min Number
  //=========================================================================================================
  /**
   * @public
   * Checks if Editor Value is to small
   * @param number - min Number
   * @param errorMessage - Error Message
   */
  public min(number: number, errorMessage?: string): this {
    this.addValidationMethod(
      this.getValidationMethodKey("minNumber"),
      async (key, value) => {
        if (!value || typeof value !== "number") return false;
        const isValid = number >= value;
        if (!isValid) {
          this.editor().setStatus(
            key,
            "error",
            errorMessage || `${key} has to be larger than ${number}`
          );
        }
        return isValid;
      }
    );
    return this;
  }

  //=========================================================================================================
  // Positive
  //=========================================================================================================
  /**
   * @public
   * Checks if Editor Value is positive
   * @param errorMessage - Error Message
   */
  public positive(errorMessage?: string): this {
    this.addValidationMethod(
      this.getValidationMethodKey("positive"),
      async (key, value) => {
        if (!value || typeof value !== "number") return false;
        const isValid = 0 >= value;
        if (!isValid) {
          this.editor().setStatus(
            key,
            "error",
            errorMessage || `${key} has to be positive`
          );
        }
        return isValid;
      }
    );
    return this;
  }

  //=========================================================================================================
  // Negative
  //=========================================================================================================
  /**
   * @public
   * Checks if Editor Value is negative
   * @param errorMessage - Error Message
   */
  public negative(errorMessage?: string): this {
    this.addValidationMethod(
      this.getValidationMethodKey("negative"),
      async (key, value) => {
        if (!value || typeof value !== "number") return false;
        const isValid = 0 <= value;
        if (!isValid) {
          this.editor().setStatus(
            key,
            "error",
            errorMessage || `${key} has to be negative`
          );
        }
        return isValid;
      }
    );
    return this;
  }
}
