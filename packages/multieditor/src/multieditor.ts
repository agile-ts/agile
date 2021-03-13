import {
  Agile,
  ComputeMethod,
  copy,
  defineConfig,
  getAgileInstance,
  Observer,
} from '@agile-ts/core';
import {
  Item,
  Validator,
  StatusType,
  StatusInterface,
  ValidationMethodInterface,
} from './internal';

export class MultiEditor<
  DataType = any,
  SubmitReturnType = void,
  OnSubmitConfigType = any
> {
  public agileInstance: () => Agile;

  public config: EditorConfigInterface;
  public isModified = false;
  public isValid = false;
  public submitted = false;
  public fixedProperties: ItemKey[] = [];
  public editableProperties: ItemKey[] = [];
  public validateMethods: DataObject<
    ValidationMethodInterface<DataType> | Validator<DataType>
  > = {};
  public computeMethods: DataObject<ComputeMethod<DataType>> = {};
  public onSubmit: (
    preparedData: DataObject<DataType>,
    config?: OnSubmitConfigType
  ) => Promise<SubmitReturnType>;

  public _key?: EditorKey;

  public data: DataObject<Item<DataType>> = {};

  /**
   * @public
   * Editor - A simple From Handler
   * @param agileInstance - An instance of Agile
   * @param config - Config
   */
  constructor(
    config: EditorConfig<DataType, SubmitReturnType, OnSubmitConfigType>,
    agileInstance?: Agile
  ) {
    if (!agileInstance) agileInstance = getAgileInstance(null);
    if (!agileInstance)
      Agile.logger.error(
        'No Global agileInstance found! Please pass an agileInstance into the MultiEditor!'
      );
    this.agileInstance = () => agileInstance as any;
    let _config = typeof config === 'function' ? config(this) : config;
    _config = defineConfig(_config, {
      fixedProperties: [],
      editableProperties: Object.keys(_config.data),
      validateMethods: {},
      computeMethods: {},
      reValidateMode: 'onSubmit',
      validate: 'editable',
    });
    this._key = _config?.key;
    this.onSubmit = _config.onSubmit as any;
    this.fixedProperties = _config.fixedProperties as any;
    this.editableProperties = _config.editableProperties as any;
    this.validateMethods = _config.validateMethods as any;
    this.computeMethods = _config.computeMethods as any;
    this.config = {
      reValidateMode: _config.reValidateMode as any,
      validate: _config.validate as any,
    };

    // Add Items to Data Object and validate it for the first Time
    for (const key in _config.data) {
      const item = new Item<DataType>(this as any, _config.data[key], key, {
        canBeEdited: this.editableProperties.includes(key),
      });
      this.data[key] = item;
      item.validate();
      if (Object.prototype.hasOwnProperty.call(this.computeMethods, key)) {
        const computeMethod = this.computeMethods[key];
        item.computeValue(computeMethod);
      }
    }
  }

  /**
   * @public
   * Set Key/Name of MultiEditor
   */
  public set key(value: EditorKey | undefined) {
    this._key = value;
  }

  /**
   * @public
   * Get Key/Name of MultiEditor
   */
  public get key(): EditorKey | undefined {
    return this._key;
  }

  /**
   * @public
   * Dependencies of the MultiEditor
   */
  public get deps(): Array<Observer> {
    const deps: Array<Observer> = [];
    for (const key in this.data) {
      const item = this.data[key];
      deps.push(item.observer);
      deps.push(item.status.observer);
    }
    return deps;
  }

  //=========================================================================================================
  // Item Dependencies
  //=========================================================================================================
  /**
   * @public
   * Dependencies of specific Item
   * @param key - Key/Name of Item
   */
  public itemDeps(key: ItemKey): Array<Observer> {
    const deps: Array<Observer> = [];
    const item = this.getItemById(key);
    if (item) {
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
   * Validator - Create validation Conditions for an Item
   */
  public Validator(): Validator<DataType> {
    return new Validator<DataType>(this as any);
  }

  //=========================================================================================================
  // Set Value
  //=========================================================================================================
  /**
   * @public
   * Assigns new Value to Item at key
   * @param key - Key/Name of Item
   * @param value - New Item Value
   * @param config - Config
   */
  public setValue(
    key: ItemKey,
    value: DataType,
    config: SetValueConfigInterface = {}
  ): this {
    const item = this.getItemById(key);
    if (!item) return this;
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
   * Assigns new initial Value to Item at key
   * @param key - Key/Name of Item
   * @param value - New Item initial Value
   * @param config - Config
   */
  public updateInitialValue(
    key: ItemKey,
    value: DataType,
    config: UpdateInitialValueConfigInterface = {}
  ): this {
    const item = this.getItemById(key);
    if (!item) return this;
    config = defineConfig(config, {
      background: false,
      reset: true,
    });

    // Update initial Value
    item.initialStateValue = copy(value);

    // Reset Item (-> Assign current Value to the new Initial Value)
    if (config.reset) {
      item.reset({
        force: true,
        background: config.background,
      });
    } else {
      item.ingest({ force: true, background: config.background });
    }

    return this;
  }

  //=========================================================================================================
  // Submit
  //=========================================================================================================
  /**
   * @public
   * Submits Editor
   * @param config - Config
   * @return false if MultiEditor is not valid
   */
  public async submit(
    config: SubmitConfigInterface<OnSubmitConfigType> = {}
  ): Promise<SubmitReturnType | false> {
    const preparedData: DataObject<DataType> = {};
    config = defineConfig(config, {
      assignToInitial: true,
      onSubmitConfig: undefined,
    });

    // Assign Statuses to Items
    for (const key in this.data) {
      const item = this.data[key];
      if (this.canAssignStatusToItemOnSubmit(item)) {
        item.status.assign({
          force: true, // Force because value hasn't changed..
          background: false,
        });
        item.status.display = true;
      }
    }

    this.submitted = true;

    // Logging
    Agile.logger.if
      .tag(['multieditor'])
      .info(`Submit MultiEditor '${this.key}'`, this.isValid);

    // Check if Editor is Valid
    if (!this.isValid) return false;

    // Add prepared Items to prepared Data
    for (const key in this.data) {
      const item = this.data[key];
      if (item.isSet && item.config.canBeEdited) {
        preparedData[key] = item.value;
        if (config.assignToInitial) this.updateInitialValue(key, item.value);
      }
    }

    // Add fixed Properties(Items) to Prepared Data
    for (const key of this.fixedProperties) {
      const item = this.getItemById(key);
      if (!item) continue;
      preparedData[key] = item.value;
    }

    return await this.onSubmit(preparedData, config.onSubmitConfig);
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
    for (const key in this.data) {
      const item = this.data[key];
      item.reset();
    }

    // Reset Editor
    this.isModified = false;
    this.submitted = false;
    this.validate();

    return this;
  }

  //=========================================================================================================
  // Set Status
  //=========================================================================================================
  /**
   * @public
   * Assigns new Status to Item at key
   * @param key - Key/Name of Item
   * @param type - Status Type
   * @param message - Status Message
   */
  public setStatus(key: ItemKey, type: StatusType, message: string): this {
    const item = this.getItemById(key);
    if (!item) return this;
    item.status.set({
      type: type,
      message: message,
    });
    return this;
  }

  //=========================================================================================================
  // Reset Status
  //=========================================================================================================
  /**
   * @public
   * Resets Status of Item at key
   * @param key - Key/Name of Item
   */
  public resetStatus(key: ItemKey): this {
    const item = this.getItemById(key);
    if (!item || !item.status) return this;
    item.status.set(null);
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
    if (!item) return null;
    return item.status.value;
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
    if (!Object.prototype.hasOwnProperty.call(this.data, key)) {
      Agile.logger.error(`Editor Item '${key}' does not exists!`);
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
  // Are Modified
  //=========================================================================================================
  /**
   * @public
   * Check if Items at Keys are modified
   * @param keys - Keys/Names of Items
   */
  public areModified(keys: ItemKey[]): boolean {
    let _isModified = false;
    for (const key of keys) {
      const item = this.getItemById(key);
      if (!item) continue;
      _isModified = _isModified || item?.isSet;
    }
    return _isModified;
  }

  //=========================================================================================================
  // Get Validator
  //=========================================================================================================
  /**
   * @private
   * Get Validator of Item based on validateMethods
   * @param key - Key/Name of Item
   */
  public getValidator(key: ItemKey): Validator<DataType> {
    if (Object.prototype.hasOwnProperty.call(this.validateMethods, key)) {
      const validation = this.validateMethods[key];
      if (validation instanceof Validator) {
        if (!validation.key) validation.key = key;
        return validation;
      } else {
        return new Validator<DataType>({
          key: key,
        }).addValidationMethod(validation);
      }
    }
    return new Validator<DataType>({ key: key });
  }

  //=========================================================================================================
  // Update Is Modified
  //=========================================================================================================
  /**
   * @internal
   * Updates the isModified property
   */
  public updateIsModified(): this {
    this.isModified = this.areModified(this.editableProperties);
    return this;
  }

  //=========================================================================================================
  // Validate
  //=========================================================================================================
  /**
   * @private
   * Validates Editor and updates its 'isValid' property
   */
  public validate(): boolean {
    let isValid = true;

    // Check if Items are Valid
    for (const key in this.data) {
      const item = this.data[key];
      if (!item.config.canBeEdited && this.config.validate === 'editable')
        continue;
      isValid = item.isValid && isValid;
    }

    this.isValid = isValid;
    return isValid;
  }

  //=========================================================================================================
  // Can Assign Status To Item On Change
  //=========================================================================================================
  /**
   * @private
   * If Status can be assigned on Change
   * @param item - Item to which the Status should get applied
   */
  public canAssignStatusToItemOnChange(item: Item): boolean {
    return (
      (this.config.reValidateMode === 'onChange' ||
        (this.config.reValidateMode === 'afterFirstSubmit' &&
          this.submitted)) &&
      (this.config.validate === 'all' ||
        (this.config.validate === 'editable' && item.config.canBeEdited) ||
        false)
    );
  }

  //=========================================================================================================
  // Can Assign Status To Item On Submit
  //=========================================================================================================
  /**
   * @private
   * If Status can be assigned on Submit
   * @param item - Item to which the Status should get applied
   */
  public canAssignStatusToItemOnSubmit(item: Item): boolean {
    return (
      (this.config.reValidateMode === 'onSubmit' ||
        (this.config.reValidateMode === 'afterFirstSubmit' &&
          !this.submitted) ||
        (this.config.reValidateMode === 'onChange' && !item.status.display)) &&
      (this.config.validate === 'all' ||
        (this.config.validate === 'editable' && item.config.canBeEdited) ||
        false)
    );
  }
}

export type DataObject<T = any> = { [key: string]: T };
export type EditorKey = string | number;
export type ItemKey = string | number;

/**
 * @param data - Data that gets registered
 * @param fixedProperties - Data that will always be passed into the 'onSubmit' Function
 * @param editableProperties - Properties that can be edited
 * @param validateMethods - Methods to validate the Data
 * @param onSubmit - Function that gets called if the Editor gets submitted
 * @param reValidateMode - When the Editor and its Data gets revalidated
 * @param validate - Which Data gets validated
 * @param reValidateMode - When the Editor and its Data gets revalidated
 * @param validate - Which Data gets validated
 */
export interface CreateEditorConfigInterface<
  DataType = any,
  SubmitReturnType = void,
  onSubmitConfig = any
> {
  key?: string;
  data: DataObject<DataType>;
  fixedProperties?: string[];
  editableProperties?: string[];
  validateMethods?: DataObject<
    ValidationMethodInterface<DataType> | Validator<DataType>
  >;
  computeMethods?: DataObject<ComputeMethod<DataType>>;
  onSubmit: (
    preparedData: DataObject<DataType>,
    config?: onSubmitConfig
  ) => Promise<SubmitReturnType>;
  reValidateMode?: RevalidationModeType;
  validate?: ValidateType;
}

/**
 * @param reValidateMode - When the Editor and its Data gets revalidated
 * @param validate - Which Data gets validated
 */
export interface EditorConfigInterface {
  reValidateMode: RevalidationModeType;
  validate: ValidateType;
}

export type EditorConfig<
  DataType = any,
  SubmitReturnType = void,
  OnSubmitConfigType = any
> =
  | CreateEditorConfigInterface<DataType, SubmitReturnType, OnSubmitConfigType>
  | ((
      editor: MultiEditor<DataType, SubmitReturnType, OnSubmitConfigType>
    ) => CreateEditorConfigInterface<
      DataType,
      SubmitReturnType,
      OnSubmitConfigType
    >);

/**
 * @param background - If assigning a new Item happens in the background (-> not causing any rerender)
 */
export interface SetValueConfigInterface {
  background?: boolean;
}

/**
 * @param assignToInitial - If modified Value gets set to the initial Value of the Item
 * @param onSubmitConfig - Config that gets passed into the onSubmit Function
 */
export interface SubmitConfigInterface<OnSubmitConfigType = any> {
  assignToInitial?: boolean;
  onSubmitConfig?: OnSubmitConfigType;
}

/**
 * @param reset - If Item gets reset -> new Initial Value gets assigned to the Item Value
 * @param background - If setting the new Item initial Value happens in the background (-> not causing any rerender)
 */
export interface UpdateInitialValueConfigInterface {
  reset?: boolean;
  background?: boolean;
}

export type RevalidationModeType = 'onChange' | 'onSubmit' | 'afterFirstSubmit';
export type ValidateType = 'all' | 'editable';
