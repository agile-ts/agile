import { Agile, defineConfig, Observer } from "@agile-ts/core";
import { ValidationMethodInterface, Validator } from "./validator";
import { Item } from "./item";
import { StatusInterface, StatusType } from "./status";

export default class MultiEditor<DataType = any, SubmitReturnType = void> {
  public agileInstance: () => Agile;

  public config: EditorConfigInterface<DataType, SubmitReturnType>;
  public isModified: boolean = false;
  public isValid: boolean = false;
  public submitted: boolean = false;

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
      reValidateMode: "onSubmit",
    });
    this._key = config?.key;

    // Add Items to Data Object
    for (let key in config.data) {
      const item = new Item(this, config.data[key], key, {
        canBeEdited: config.editableProperties.includes(key),
      });
      this.data[key] = item;
      item.validate();
    }
  }

  /**
   * @public
   * Set Key/Name of Editor
   */
  public set key(value: EditorKey | undefined) {
    this._key = value;
  }

  /**
   * @public
   * Get Key/Name of Editor
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
      deps.push(item.status.observer);
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
    key: ItemKey,
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
    key: ItemKey,
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

    // Assign Status to Items
    if (
      this.config.reValidateMode === "onSubmit" ||
      (this.config.reValidateMode === "afterFirstSubmit" && !this.submitted)
    )
      for (let key in this.data) {
        this.data[key].status.assignStatus();
        this.data[key].showStatus = true;
      }

    this.submitted = true;

    // Logging
    if (this.agileInstance().config.logJobs)
      console.log(`Agile: Submit MultiEditor ${this.key}`, this.isValid);

    // Check if Editor is Valid
    if (!this.isValid) return false;

    // Create Prepared Data
    const preparedData: DataObject<DataType> = {};
    for (let key in this.data) {
      const item = this.data[key];
      if (!item.canBeEdited) continue;
      if (item.isSet) preparedData[key] = item.value;
      if (config.assignToInitial) this.updateInitialValue(key, item.value);
    }
    for (let key of this.config.fixedProperties) {
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
      item.status.setStatus(null);
    }

    // Reset Editor
    this.isModified = false;
    this.validate();
    this.submitted = false;

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
  public setStatus(key: ItemKey, type: StatusType, message: string): this {
    const item = this.getItemById(key);
    if (!item) return this;
    item.status.setStatus({
      type: type,
      message: message,
    });

    // Assign Status to Item
    if (
      this.config.reValidateMode === "onChange" ||
      (this.config.reValidateMode === "afterFirstSubmit" && this.submitted)
    )
      item.status.assignStatus();

    // Logging
    if (this.agileInstance().config.logJobs)
      console.log(`Agile: Set Status of Item '${key}'`);

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
  public resetStatus(key: ItemKey): this {
    const item = this.getItemById(key);
    if (!item || !item.status) return this;
    item.status.setStatus(null);

    // If Status should get assigned if the status changes during the value updating
    if (
      this.config.reValidateMode === "onChange" ||
      (this.config.reValidateMode === "afterFirstSubmit" && this.submitted)
    )
      item.status.assignStatus();

    // Logging
    if (this.agileInstance().config.logJobs)
      console.log(`Agile: Reset Status of Item '${key}'`);

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
  public getStatus(key: ItemKey): StatusInterface | null {
    const item = this.getItemById(key);
    if (!item || !item.showStatus) return null;

    return item.status.status;
  }

  //=========================================================================================================
  // Get Item By Id
  //=========================================================================================================
  /**
   * @public
   * Get Item by Id
   * @param key - Key/Name of Item
   */
  public getItemById(key: ItemKey): Item<DataType> | undefined {
    if (!this.data.hasOwnProperty(key)) {
      console.error(`Agile: Editor Item '${key}' does not exists!`);
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
   * Get Validator of Item
   * @param key - Key/Name of Item
   */
  public getValidator(key: ItemKey): Validator<DataType> {
    // Prepare Validator
    if (this.config.validateMethods.hasOwnProperty(key)) {
      const validation = this.config.validateMethods[key];
      if (validation instanceof Validator) {
        if (!validation.key) validation.key = key;
        return validation;
      } else {
        return new Validator(this, key).addValidationMethod(validation);
      }
    }

    return new Validator<DataType>(this, key);
  }

  //=========================================================================================================
  // Are Modified
  //=========================================================================================================
  /**
   * @public
   * Check if Items at Keys are modified
   * @param keys - Keys/Names of Items
   */
  public areModified(keys: ItemKey[]): boolean {
    let _isModified = false;
    for (let key of keys) {
      const item = this.getItemById(key);
      if (!item) continue;
      _isModified = _isModified || item?.isSet;
    }
    return _isModified;
  }

  //=========================================================================================================
  // Update Is Modified
  //=========================================================================================================
  /**
   * @internal
   * Updates the is Modified property
   */
  public updateIsModified(): this {
    this.isModified = this.areModified(this.config.editableProperties);
    return this;
  }

  //=========================================================================================================
  // Validate
  //=========================================================================================================
  /**
   * @private
   * Validates Editor and updates this.isValid
   */
  public validate(): boolean {
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
export type ItemKey = string | number;

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

export type RevalidateType = "onChange" | "onSubmit" | "afterFirstSubmit";
