import { Agile, State } from "@agile-ts/core";

export default class Editor<DataType = any, SubmitReturn = void> {
  public agileInstance: () => Agile;

  public config: EditorConfigInterface<DataType, SubmitReturn>;
  public isModified: boolean = false;
  public isValid: boolean = false;

  public _key?: EditorKey;

  public editedData: State<DataObject<DataType>>; // Data that got edited
  public initialData: State<DataObject<DataType>>; // Initial Data of this Editor
  public preparedData: State<DataObject<DataType>>; // Data that gets passed into the submit Function
  public propertiesWithStatus: State<DataObject<StatusInterface>>; // Properties that have an Status

  /**
   * @public
   * Editor - Makes Form creating easier
   * @param agileInstance - An instance of Agile
   * @param config - Config
   */
  constructor(
    agileInstance: Agile,
    config: EditorConfigInterface<DataType, SubmitReturn>
  ) {
    this.agileInstance = () => agileInstance;
    this.config = config;
    this._key = config?.key;
    this.initialData = agileInstance.State(config.data);
    this.editedData = agileInstance.State(config.data);
    this.preparedData = agileInstance.State({});
    this.propertiesWithStatus = agileInstance.State({});
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
    return [this.propertiesWithStatus, this.preparedData, this.initialData];
  }
}

export type DataObject<T = any> = { [key: string]: T };
export type EditorKey = string | number;
export type StatusType = "error" | "success";

/**
 * @param type - Type of the Status
 * @param message - Message of the Status
 *
 */
export interface StatusInterface {
  type: StatusType;
  message: string;
}

/**
 * @param data - Data the Editor handles
 * @param fixedProperties - Data that will always be passed into the 'onSubmit' Function
 * @param editableProperties - Properties that can be edited
 * @param validateMethods - Methods to validate the Data
 * @param onSubmit - Function that gets called if the Editor gets submitted
 */
export interface EditorConfigInterface<DataType = any, SubmitReturn = void> {
  key?: string;
  data: DataObject<DataType>;
  fixedProperties: string[];
  editableProperties: string[];
  validateMethods: DataObject<() => Promise<boolean>>;
  onSubmit: (preparedData: DataObject<DataType>) => Promise<SubmitReturn>;
}
