import MultiEditor, { DataObject } from "./index";
import { ValidationMethodInterface } from "./item";

export class Validator<DataType = any, SubmitReturnType = void> {
  public validationMethods: DataObject<ValidationMethodInterface> = {};
  public editor: MultiEditor<DataType, SubmitReturnType>;

  /**
   * @public
   * Validator - Easy way to tell the Editor conditions which the EditorValue has to follow
   * @param editor -
   */
  constructor(editor: MultiEditor<DataType, SubmitReturnType>) {
    this.editor = editor;
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
    for (let key in this.validationMethods) {
      isValid = (await this.validationMethods[key](key, value)) && isValid;
    }
    return isValid;
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
    this.validationMethods["maxLength"] = async (
      key: string,
      value: DataType
    ) => {
      if (Array.isArray(value)) {
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

      return true;
    };
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
    this.validationMethods["minLength"] = async (
      key: string,
      value: DataType
    ) => {
      if (Array.isArray(value)) {
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

      return true;
    };
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
    this.validationMethods["required"] = async (
      key: string,
      value: DataType
    ) => {
      const isValid = !!value;
      if (!isValid) {
        this.editor.setStatus(key, "error", `${key} has to exist`);
      }
      return isValid;
    };
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
    this.validationMethods["email"] = async (key: string, value: DataType) => {
      if (typeof value === "string") {
        const emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        const isValid = emailRegex.test(value.toLowerCase());
        if (!isValid) {
          this.editor.setStatus(key, "error", `${key} is no valid Email`);
        }
        return isValid;
      }
      return false;
    };
    return this;
  }
}
