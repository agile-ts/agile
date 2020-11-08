import { Agile, defineConfig, equal, Observer } from "@agile-ts/core";
import { Validator } from "./validator";
import {
  Item,
  StatusInterface,
  StatusType,
  ValidationMethodInterface,
} from "./item";

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
   * Dependencies of the MultiEditor
   */
  public get dependencies() {
    const deps: Array<Observer> = [];
    for (let key in this.data) {
      const item = this.data[key];
      deps.push(item.observer);
    }
    return deps;
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
  ): this {
    const item = this.getItemById(key);
    if (!item || !item.canBeEdited) return this;
    config = defineConfig(config, {
      background: true,
    });

    // Apply changes to Item
    item.set(value, config);

    return this;
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
  ): this {
    const item = this.getItemById(key);
    if (!item) return this;
    config = defineConfig(config, {
      background: true,
    });

    // Item Initial Value and force Rerender
    item.initialStateValue = value;
    item.ingest({ forceRerender: true, ...config });

    return this;
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
      assignToInitial: true,
      onSubmitConfig: undefined,
    });

    // Check if Editor is Valid
    if (!this.isValid) return false;

    // Create Prepared Data
    const preparedData: DataObject<DataType> = {};
    for (let key in this.data) {
      const item = this.data[key];
      if (item.isSet) preparedData[key] = item.value;
      if (config.assignToInitial) this.updateInitialValue(key, item.value);
    }
    for (let key in this.config.fixedProperties) {
      const item = this.getItemById(key);
      if (!item) continue;
      preparedData[key] = item.value;
    }

    return await this.config.onSubmit(preparedData, config);
  }

  //=========================================================================================================
  // Reset
  //=========================================================================================================
  /**
   * @public
   * Resets Editor
   */
  public reset(): this {
    // Reset Items
    for (let key in this.data) {
      const item = this.data[key];
      item.reset();
      item.status = null;
    }

    // Reset Editor
    this.isModified = false;
    this.validate();

    return this;
  }

  //=========================================================================================================
  // Set Status
  //=========================================================================================================
  /**
   * @public
   * Assign new Status to an Item
   * @param key - Key/Name of Item
   * @param type - Status Type
   * @param message - Status Message
   */
  public setStatus(key: string, type: StatusType, message: string): this {
    const item = this.getItemById(key);
    if (!item) return this;

    // Create new Status and check if its different to the current Status
    const newStatus = {
      type: type,
      message: message,
    };
    if (equal(item.status, newStatus)) return this;

    // Assign new Status and force Rerender
    item.status = newStatus;
    item.ingest({ forceRerender: true });

    return this;
  }

  //=========================================================================================================
  // Reset Status
  //=========================================================================================================
  /**
   * @public
   * Reset Status of Item
   * @param key - Key/Name of Item
   */
  public resetStatus(key: string): this {
    const item = this.getItemById(key);
    if (!item || !item.status) return this;

    // Reset Status and force Rerender
    item.status = null;
    item.ingest({ forceRerender: true });

    return this;
  }

  //=========================================================================================================
  // Get Status
  //=========================================================================================================
  /**
   * @public
   * Get Status of Item
   * @param key - Key/Name of Item
   */
  public getStatus(key: string): StatusInterface | null {
    const item = this.getItemById(key);
    if (!item) return null;

    return item.status;
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
   * Validates Editor and updates this.isValid
   */
  public async validate(): Promise<boolean> {
    let isValid = true;

    // Check if Items are Valid
    for (let key in this.data) {
      const item = this.data[key];
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
 * @param assignToInitial - Modified Value gets set to the Item Inital Value after submitting
 * @param onSubmitConfig - Config that gets passed into the onSubmit Function
 */
export interface SubmitConfigInterface {
  assignToInitial?: boolean;
  onSubmitConfig?: any;
}

export type RevalidateType = "onChange" | "onSubmit";
