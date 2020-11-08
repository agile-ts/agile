import { Agile, copy, defineConfig } from "@agile-ts/core";
import { Validator } from "./validator";
import { Item, StatusType, ValidationMethodInterface } from "./item";

export default class MultiEditor<DataType = any, SubmitReturnType = void> {
  public agileInstance: () => Agile;

  public config: EditorConfigInterface<DataType, SubmitReturnType>;
  public isModified: boolean = false;
  public isValid: boolean = false;

  public _key?: EditorKey;

  public data: DataObject<Item<DataType>> = {};

  /**
   * @public
   * Editor - Makes Form creating easier
   * @param agileInstance - An instance of Agile
   * @param config - Config
   */
  constructor(
    agileInstance: Agile,
    config: EditorConfig<DataType, SubmitReturnType>
  ) {
    this.agileInstance = () => agileInstance;
    if (typeof config === "function") config = config(this);
    this.config = this.config = defineConfig(config, {
      reValidateMode: "onChange",
    });
    this._key = config?.key;

    // Add Items to Data Object
    for (let key in config.data)
      this.data[key] = new Item(this, config.data[key], key, {
        canBeEdited: config.editableProperties.includes(key),
      });
  }

  /**
   * @public
   * Set Key/Name of State
   */
  public set key(value: EditorKey | undefined) {
    this._key = value;
  }

  /**
   * @public
   * Get Key/Name of State
   */
  public get key(): EditorKey | undefined {
    return this._key;
  }

  /**
   * @public
   * Returns all Agile Dependencies of this Editor
   */
  public get dependencies() {
    // TODO return all dependencies that a component needs to rerender
    //  return [this.propertiesWithStatus, this.initialData];
    return null;
  }

  //=========================================================================================================
  // Validator
  //=========================================================================================================
  /**
   * @public
   * Validator - Easy way to tell the Editor conditions which the EditorValue has to follow
   */
  public Validator(): Validator<DataType, SubmitReturnType> {
    return new Validator<DataType, SubmitReturnType>(this);
  }

  //=========================================================================================================
  // Set Value
  //=========================================================================================================
  /**
   * @public
   * Assign new Value to Item
   * @param key - Key/Name of Item
   * @param value - New Value of Item
   * @param config - Config
   */
  public setValue(
    key: string,
    value: DataType,
    config: SetValueConfigInterface = {}
  ) {
    const item = this.getItemById(key);
    if (!item || !item.canBeEdited) return;
    config = defineConfig(config, {
      background: true,
    });

    // Patch changes into Item
    item.patch({ value: value }, config);
  }

  //=========================================================================================================
  // Update Initial Value
  //=========================================================================================================
  /**
   * @public
   * Assign new initial Value to Item
   * @param key - Key/Name of Item
   * @param value - New initial Value of Item
   * @param config - Config
   */
  public updateInitialValue(
    key: string,
    value: DataType,
    config: SetValueConfigInterface = {}
  ) {
    const item = this.getItemById(key);
    if (!item) return;
    config = defineConfig(config, {
      background: true,
    });

    // Item Initial Value and force Rerender
    item.initialStateValue = value;
    item.ingest({ forceRerender: true, ...config });
  }

  //=========================================================================================================
  // Submit
  //=========================================================================================================
  /**
   * @public
   * Submit Editor
   * @param config - Config
   */
  public async submit(
    config: SubmitConfigInterface = {}
  ): Promise<SubmitReturnType | false> {
    config = defineConfig(config, {
      reset: true,
      onSubmitConfig: undefined,
    });

    // Check if Editor is Valid
    if (!this.isValid) return false;

    // TODO create prepared Data
    return await this.config.onSubmit({}, config);
  }

  //=========================================================================================================
  // Set Status
  //=========================================================================================================
  /**
   * @public
   * Set Status of an Item
   * @param key - Key/Name of Item
   * @param type - Status Type
   * @param message - Status Message
   */
  public setStatus(key: string, type: StatusType, message: string) {
    const item = this.getItemById(key);
    if (!item) return;
    item.status = {
      type: type,
      message: message,
    };
  }

  //=========================================================================================================
  // Get Item By Id
  //=========================================================================================================
  /**
   * @public
   * Get Item by Id
   * @param key - Key/Name of Item
   */
  public getItemById(key: string): Item<DataType> | undefined {
    if (!this.data.hasOwnProperty(key)) {
      console.error(`Agile: ${key} does not exists!`);
      return undefined;
    }
    return this.data[key];
  }

  //=========================================================================================================
  // Get Value By Id
  //=========================================================================================================
  /**
   * @public
   * Get Value of Item by Id
   * @param key - Key/Name of Item that holds the Value
   */
  public getValueById(key: string): DataType | undefined {
    return this.getItemById(key)?.value;
  }

  //=========================================================================================================
  // Get Validation Method
  //=========================================================================================================
  /**
   * @public
   * Get ValidationMethod of Item
   * @param key - Key/Name of Item
   */
  public getValidationMethod(key: string): ValidationMethodInterface {
    // Prepare Validation Method
    if (this.config.validateMethods.hasOwnProperty(key)) {
      const validation = this.config.validateMethods[key];
      return validation instanceof Validator ? validation.validate : validation;
    }

    // Return Validation Method that does always return valid, if no validationMethod is given
    return (): Promise<boolean> => Promise.resolve(true);
  }

  //=========================================================================================================
  // Are Modified
  //=========================================================================================================
  /**
   * @public
   * Check if Items at Keys are modified
   * @param keys - Keys/Names of Items
   */
  public areModified(keys: string[]): boolean {
    let _isModified = false;
    for (let key in keys) {
      const item = this.getItemById(key);
      if (!item) continue;
      _isModified = _isModified || item?.isSet;
    }
    return _isModified;
  }

  //=========================================================================================================
  // Validate
  //=========================================================================================================
  /**
   * @private
   * Validates the Editor
   */
  public async validate(): Promise<boolean> {
    let isValid = true;

    // Check if Items are Valid
    for (let key in this.data) {
      const item = this.getItemById(key);
      if (!item) continue;
      isValid = item.isValid && isValid;
    }

    this.isValid = isValid;
    return isValid;
  }
}

export type DataObject<T = any> = { [key: string]: T };
export type EditorKey = string | number;

/**
 * @param data - Data the Editor handles
 * @param fixedProperties - Data that will always be passed into the 'onSubmit' Function
 * @param editableProperties - Properties that can be edited
 * @param validateMethods - Methods to validate the Data
 * @param onSubmit - Function that gets called if the Editor gets submitted
 * @param reValidateMode - When the Editor gets revalidated
 */
export interface EditorConfigInterface<
  DataType = any,
  SubmitReturnType = void
> {
  key?: string;
  data: DataObject<DataType>;
  fixedProperties: string[];
  editableProperties: string[];
  validateMethods: DataObject<
    ValidationMethodInterface<DataType> | Validator<DataType, SubmitReturnType>
  >;
  onSubmit: (
    preparedData: DataObject<DataType>,
    config?: any
  ) => Promise<SubmitReturnType>;
  reValidateMode?: RevalidateType;
}

export type EditorConfig<DataType = any, SubmitReturnType = void> =
  | EditorConfigInterface<DataType, SubmitReturnType>
  | ((
      editor: MultiEditor<DataType, SubmitReturnType>
    ) => EditorConfigInterface<DataType, SubmitReturnType>);

/**
 * @param background - If assigning a new Item happens in the background (-> not causing any rerender)
 */
export interface SetValueConfigInterface {
  background?: boolean;
}

/**
 * @param reset - If Editor gets reset
 * @param onSubmitConfig - Config that gets passed into the onSubmit Function
 */
export interface SubmitConfigInterface {
  reset?: boolean;
  onSubmitConfig?: any;
}

export type RevalidateType = "onChange" | "onSubmit";
