import { Agile, copy, defineConfig, State } from "@agile-ts/core";
import { Validator } from "./validator";

export default class MultiEditor<DataType = any, SubmitReturnType = void> {
  public agileInstance: () => Agile;

  public config: EditorConfigInterface<DataType, SubmitReturnType>;
  public isModified: boolean = false;
  public isValid: boolean = false;

  public _key?: EditorKey;

  public data: DataObject<State<ItemInterface<DataType>>>;

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
    this.config = config;
    this._key = config?.key;

    // Build Data Object
    const data = {};
    for (let key in config.data) {
      const dataState = agileInstance.State<ItemInterface<DataType>>(
        {
          value: config.data[key],
          status: null,
          validationMethod: this.getValidationMethod(key),
        },
        key
      );
      data[key] = dataState;
    }

    this.data = data;
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
   * Validator - Easy way to tell the Editor conditions which the EditorValue has to follow
   */
  public Validator(): Validator<DataType, SubmitReturnType> {
    return new Validator<DataType, SubmitReturnType>(this);
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

  /**
   * @public
   * Assign new Value to Item at property
   * @param key - Key/Name of Item
   * @param value - New Value of Item
   * @param config - Config
   */
  public setValue(
    key: string,
    value: DataType,
    config: SetValueConfigInterface = {}
  ) {
    if (!this.canBeEdited(key)) return;

    const item = this.getItem(key);
    if (!item) return;
    config = defineConfig(config, {
      background: true,
    });

    // Patch changes into Item
    item.patch({ value: value }, config);
  }

  /**
   * @private
   * Validates the Editor -> executes Validation Methods
   */
  public async validateEditor(): Promise<boolean> {
    let isValid = true;

    // Call ValidationMethod for eachItem
    for (let key in this.getEditableItems()) {
      const item = this.getItem(key);
      isValid =
        ((await item?.value.validationMethod(key, item?.value.value)) ||
          true) &&
        isValid;
    }

    return isValid;
  }

  /**
   * @public
   * Get the Validation Method of an Item
   * @param key - Key/Name of Item
   */
  public getValidationMethod(key: string): ValidationMethodInterface {
    if (this.config.validateMethods.hasOwnProperty(key)) {
      const validation = this.config.validateMethods[key];
      return validation instanceof Validator ? validation.validate : validation;
    }
    return (): Promise<boolean> => Promise.resolve(true);
  }

  /**
   * @public
   * Set Status of an Item
   * @param key - Key/Name of Item
   * @param type - Status Type
   * @param message - Status Message
   */
  public setStatus(key: string, type: StatusType, message: string) {}

  /**
   * @public
   * Get Item at Property
   * @param key - Key/Name of Item
   */
  public getItem(key: string): State<ItemInterface<DataType>> | undefined {
    if (!this.data.hasOwnProperty(key)) {
      console.error(`Agile: ${key} does not exists!`);
      return undefined;
    }
    return this.data[key];
  }

  /**
   * @public
   * Get Value at Property
   * @param key - Key/Name of Item
   */
  public getValue(key: string): DataType | undefined {
    return this.getItem(key)?.value.value;
  }

  /**
   * @public
   * Get Initial Value at Property
   * @param key - Key/Name of Item
   */
  public getInitialValue(key: string): DataType | undefined {
    return this.getItem(key)?.initialStateValue.value;
  }

  /**
   * @public
   * Get previous Value at Property
   * @param key - Key/Name of Item
   */
  public getPreviousValue(key: string): DataType | undefined {
    return this.getItem(key)?.previousStateValue.value;
  }

  /**
   * @public
   * Checks if Value at property can be Edited
   * @param key - Key/Name of Item
   */
  public canBeEdited(key: string): boolean {
    return this.config.editableProperties.includes(key);
  }

  /**
   * @private
   * Get Items that can be Edited
   */
  public getEditableItems(): DataObject<State<ItemInterface<DataType>>> {
    const editableItemsData = {};
    for (let key in this.data) {
      if (this.canBeEdited(key)) editableItemsData[key] = copy(this.data[key]);
    }
    return editableItemsData;
  }
}

export type DataObject<T = any> = { [key: string]: T };
export type EditorKey = string | number;
export type StatusType = "error" | "success";

/**
 * @param type - Type of the Status
 * @param message - Message of the Status
 */
export interface StatusInterface {
  type: StatusType;
  message: string;
}

/**
 * @param value - Value of Item
 * @param status - Status of Item
 */
export interface ItemInterface<DataType = any> {
  value: DataType;
  status: StatusType | null;
  validationMethod: ValidationMethodInterface<DataType>;
}

/**
 * @param data - Data the Editor handles
 * @param fixedProperties - Data that will always be passed into the 'onSubmit' Function
 * @param editableProperties - Properties that can be edited
 * @param validateMethods - Methods to validate the Data
 * @param onSubmit - Function that gets called if the Editor gets submitted
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
  onSubmit: (preparedData: DataObject<DataType>) => Promise<SubmitReturnType>;
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

export type ValidationMethodInterface<DataType = any> = (
  key: string,
  value: DataType
) => Promise<boolean>;
