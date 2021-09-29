import { Agile, Observer, StateIngestConfigInterface } from '@agile-ts/core';
import { defineConfig, removeProperties } from '@agile-ts/utils';
import { Validator } from '../validator';
import { Item, ItemKey } from '../item';
import { StatusInterface, StatusType } from '../status';
import {
  DeepFieldPaths,
  DeepFieldPathValues,
  EditorConfig,
  EditorConfigInterface,
  EditorKey,
  EditorValidationSchemaType,
  FieldData,
  FieldPaths,
  RecomputeValidatedStateMethodConfigInterface,
  SubmitConfigInterface,
  UpdateInitialValueConfigInterface,
} from './types';
import { updateNestedProperty } from '../utils';

export class Multieditor<TFieldData extends FieldData = FieldData> {
  // Agile Instance the Multieditor belongs to
  public agileInstance: () => Agile;

  public config: EditorConfigInterface;

  // Key/Name identifier of the Multieditor
  public _key?: EditorKey;

  public isModified = false;
  public isValid = false;
  public submitted = false;

  // Item keys of Items to be added to the submit data all the time
  public fixedProperties: ItemKey[] = [];
  // Item keys of Items that can be edited
  public editableProperties: ItemKey[] = [];

  public onSubmit: (
    preparedData: { [key: string]: any },
    config?: Object
  ) => Promise<any>;

  // Items the Multieditor works with
  public data: { [key: string]: Item } = {};

  /**
   * Simple Form Handler.
   *
   * @public
   * @param agileInstance - Instance of Agile the Multieditor belongs to.
   * @param config - Configuration object
   */
  constructor(config: EditorConfig<TFieldData>, agileInstance: Agile) {
    this.agileInstance = () => agileInstance;
    let _config = typeof config === 'function' ? config(this) : config;
    _config = defineConfig(_config, {
      key: undefined,
      fixedProperties: [],
      editableProperties: Object.keys(_config.initialData),
      validationSchema: {},
      computeMethods: {},
      reValidateMode: 'onSubmit',
      toValidate: 'editable',
    });
    this._key = _config.key;
    this.onSubmit = _config.onSubmit as any;
    this.fixedProperties = _config.fixedProperties as any;
    this.editableProperties = _config.editableProperties as any;
    this.config = {
      reValidateMode: _config.reValidateMode as any,
      toValidate: _config.toValidate as any,
    };

    // Format specified validation instances to valid Validators
    const formattedValidators: {
      [key: string]: Validator;
    } = {};
    Object.keys(_config.validationSchema as EditorValidationSchemaType).forEach(
      (key) => {
        const validationMethod = (_config.validationSchema as EditorValidationSchemaType)[
          key
        ];

        // If validation schema item is a Validator
        if (validationMethod instanceof Validator) {
          if (validationMethod.key == null) validationMethod.key = key;
          formattedValidators[key] = validationMethod;
        }

        // If validation schema item is a method
        else {
          formattedValidators[key] = new Validator({
            key,
          }).addValidationMethod(validationMethod);
        }
      }
    );

    // Instantiate Multieditor Items based on the 'initialData'
    for (const key in _config.initialData) {
      const data = _config.initialData[key];
      const item = new Item<typeof data>(this as any, data, {
        key,
        canBeEdited: this.editableProperties.includes(key),
        validator: formattedValidators[key],
      });
      if (Object.prototype.hasOwnProperty.call(_config.computeMethods, key))
        item.computeValue((_config.computeMethods as any)[key]);
      this.data[key] = item;
      item.validate(); // Initial validate
    }
  }

  /**
   * Updates the key/name identifier of the Multieditor.
   *
   * @public
   * @param value - New key/name identifier.
   */
  public set key(value: EditorKey | undefined) {
    this._key = value;
  }

  /**
   * Returns the key/name identifier of the Multieditor.
   *
   * @public
   */
  public get key(): EditorKey | undefined {
    return this._key;
  }

  /**
   * Returns an array of dependencies the Multieditor depends on.
   *
   * These returned dependencies can be bound to a UI-Component
   * the Mutlieditor is used in, to make the Form reactive.
   *
   * @public
   */
  public get deps(): Array<Observer> {
    const deps: Array<Observer> = [];
    for (const key in this.data) {
      const item = this.data[key];
      deps.push(item.observers['value']);
      deps.push(item.status.observers['value']);
    }
    return deps;
  }

  /**
   * Returns an array of dependencies the Item
   * with the specified key/name identifier depends on.
   *
   * @public
   * @param itemKey - Key/Name identifier of the Item.
   */
  public itemDeps(itemKey: FieldPaths<TFieldData>): Array<Observer> {
    const deps: Array<Observer> = [];
    const item = this.getItem(itemKey);
    if (item) {
      deps.push(item.observers['value']);
      deps.push(item.status.observers['value']);
    }
    return deps;
  }

  /**
   * Assigns a new value to the Item with the specified key/name identifier.
   *
   * @public
   * @param itemKey - Key/Name identifier of the Item.
   * @param value - New Item value
   * @param config - Configuration object
   */
  public setValue<
    TItemName extends DeepFieldPaths<TFieldData> = DeepFieldPaths<TFieldData>
  >(
    itemKey: TItemName,
    value: DeepFieldPathValues<TFieldData, TItemName>,
    config: StateIngestConfigInterface = {}
  ): this {
    config = defineConfig(config, {
      background: true, // Because by default the Form should only be re-rendered when the Status updates
    });
    const path = itemKey.toString().split('.');

    // Fetch Item
    const item = this.getItem(path.shift() as any);
    if (item == null) return this;

    // Update current value
    if (path.length > 0) {
      item.set(
        updateNestedProperty(item.nextStateValue, path, value) as any,
        config
      );
    } else {
      item.set(value, config);
    }

    return this;
  }

  /**
   * Assigns a new initial value to the Item with the specified key/name identifier.
   *
   * @public
   * @param itemKey - Key/Name identifier of the Item.
   * @param value - New Item initial value
   * @param config - Configuration object
   */
  public setInitialValue<
    TItemName extends DeepFieldPaths<TFieldData> = DeepFieldPaths<TFieldData>
  >(
    itemKey: TItemName,
    value: DeepFieldPathValues<TFieldData, TItemName>,
    config: UpdateInitialValueConfigInterface = {}
  ): this {
    config = defineConfig(config, {
      background: true, // Because by default the Form should only be re-rendered when the Status updates
      reset: true,
    });
    const path = itemKey.toString().split('.');

    // Fetch Item
    const item = this.getItem(path.shift() as any);
    if (item == null) return this;

    // Update initial value
    if (path.length > 0) {
      item.initialStateValue = updateNestedProperty(
        item.initialStateValue,
        path,
        value
      ) as any;
    } else {
      item.initialStateValue = value;
    }

    // Reset Item (-> assign initial value to the current value)
    if (config.reset) {
      item.reset(removeProperties(config, ['reset']));
    }

    return this;
  }

  /**
   * Submits the Multieditor.
   *
   * @public
   * @param config - Configuration object
   */
  public async submit(
    config: SubmitConfigInterface = {}
  ): Promise<any | false> {
    config = defineConfig(config, {
      assignToInitial: true,
      onSubmitConfig: undefined,
    });

    // Assign Statuses to Items
    for (const key in this.data) {
      const item = this.data[key];
      if (this.canAssignStatusToItemOnSubmit(item)) {
        item.status.config.display = true;
        item.status.ingest({
          force: true, // Force because the value hasn't changed
        });
      }
    }

    this.submitted = true;

    // Check whether the Multieditor is valid and thus can be submitted
    if (!this.isValid) return false;

    // Data to be passed to the 'onSubmit()' method
    const preparedData = {};

    // Add Items whose value has been updated to the prepared data
    for (const key in this.data) {
      const item = this.data[key];
      if (item.isSet && item.config.canBeEdited) {
        preparedData[key] = item.value;

        // Assign 'submitted' Item value as initial Item value
        if (config.assignToInitial) this.setInitialValue(key, item.value);
      }
    }

    // Add fixed properties (Items) to the prepared data
    for (const key of this.fixedProperties) {
      const item = this.getItem(key);
      if (!item) continue;
      preparedData[key] = item.value;
    }

    return await this.onSubmit(preparedData, config.onSubmitConfig);
  }

  /**
   * Resets the Multieditor and all its Items.
   *
   * @public
   */
  public reset(): this {
    // Reset Items
    for (const key in this.data) this.data[key].reset();

    // Reset Editor
    this.isModified = false;
    this.submitted = false;
    // this.recomputeValidatedState(); // already recomputed during the reset of the Items

    return this;
  }

  /**
   * Assigns the specified new Status to the Item with the specified key/name identifier.
   *
   * However, if tracking of the particular Status is active,
   * the value is only tracked (not applied).
   * If the tracking has been finished the last tracked Status value should be applied to the Status.
   *
   * @public
   * @param itemKey - Key/Name identifier of the Item.
   * @param type - Status type
   * @param message - Status message
   */
  public setStatus(
    itemKey: FieldPaths<TFieldData>,
    type: StatusType,
    message: string
  ): this {
    const item = this.getItem(itemKey);
    if (item == null) return this;
    item.status.set(
      {
        type,
        message,
      },
      { waitForTracking: true }
    );
    return this;
  }

  /**
   * Resets the Status of the Item with the specified key/name identifier.
   *
   * @public
   * @param itemKey - Key/Name identifier of the Item.
   */
  public resetStatus(itemKey: FieldPaths<TFieldData>): this {
    const item = this.getItem(itemKey);
    if (item == null || item.status == null) return this;
    item.status.set(null);
    return this;
  }

  /**
   * Retrieves the Status of the Item with the specified key/name identifier.
   *
   * If the to retrieve Status doesn't exist, `null` is returned.
   *
   * @public
   * @param itemKey - Key/Name identifier of the Item.
   */
  public getStatus(itemKey: FieldPaths<TFieldData>): StatusInterface | null {
    return this.getItem(itemKey)?.status.value || null;
  }

  /**
   * Retrieves a single Item with the specified key/name identifier from the Multieditor.
   *
   * If the to retrieve Item doesn't exist, `undefined` is returned.
   *
   * @public
   * @param itemKey - Key/Name identifier of the Item.
   */
  public getItem<
    TItemName extends FieldPaths<TFieldData> = FieldPaths<TFieldData>
  >(
    itemKey: TItemName
  ): Item<DeepFieldPathValues<TFieldData, TItemName>> | undefined {
    return this.data[itemKey as string];
  }

  /**
   * Retrieves the initial value of a single Item
   * with the specified key/name identifier from the Multieditor.
   *
   * If the to retrieve Item containing the initial value doesn't exist, `undefined` is returned.
   *
   * @public
   * @param itemKey - Key/Name identifier of the Item.
   */
  public getItemValue<
    TItemName extends FieldPaths<TFieldData> = FieldPaths<TFieldData>
  >(
    itemKey: TItemName
  ): DeepFieldPathValues<TFieldData, TItemName> | undefined {
    return this.getItem(itemKey)?.value;
  }

  /**
   * Retrieves the value of a single Item
   * with the specified key/name identifier from the Multieditor.
   *
   * If the to retrieve Item containing the initial value doesn't exist, `undefined` is returned.
   *
   * @public
   * @param itemKey - Key/Name identifier of the Item.
   */
  public getItemInitialValue<
    TItemName extends FieldPaths<TFieldData> = FieldPaths<TFieldData>
  >(
    itemKey: TItemName
  ): DeepFieldPathValues<TFieldData, TItemName> | undefined {
    return this.getItem(itemKey)?.initialStateValue;
  }

  /**
  /**
   * Returns a boolean indicating whether at least one Item
   * of the Items with the specified key/name identifiers is modified.
   *
   * @public
   * @param itemKeys - Key/Name identifiers of the Items.
   */
  public areModified(itemKeys: ItemKey[]): boolean {
    let _isModified = false;
    for (const key of itemKeys) {
      const item = this.getItem(key);
      if (item == null) continue;
      _isModified = _isModified || item.isSet;
    }
    return _isModified;
  }

  /**
   * Recomputes the modified state of the Multieditor
   * based on its Items modified status.
   *
   * @public
   */
  public recomputeModifiedState(): this {
    this.isModified = this.areModified(this.editableProperties);
    return this;
  }

  /**
   * Recomputes the validated state of the Multieditor
   * based on its Items validation status.
   *
   * @public
   */
  public recomputeValidatedState(
    config: RecomputeValidatedStateMethodConfigInterface = {}
  ): boolean {
    config = defineConfig(config, {
      validate: true,
    });
    let isValid = true;

    // Check whether all Items are valid
    for (const key in this.data) {
      const item = this.data[key];
      if (config.validate) item.validate();
      if (!item.config.canBeEdited && this.config.toValidate === 'editable')
        continue;
      isValid = item.isValid && isValid;
    }

    this.isValid = isValid;
    return isValid;
  }

  /**
   * Revalidates the Multieditor.
   *
   * @public
   */
  public validate(): boolean {
    return this.recomputeValidatedState({ validate: true });
  }

  /**
   * Returns a boolean indication whether the Status of the specified Item
   * can be updated during a value change of the Item.
   *
   * @internal
   * @param item - Item
   */
  public canAssignStatusToItemOnChange(item: Item): boolean {
    return (
      (this.config.reValidateMode === 'onChange' ||
        (this.config.reValidateMode === 'afterFirstSubmit' &&
          this.submitted)) &&
      (this.config.toValidate === 'all' ||
        (this.config.toValidate === 'editable' && item.config.canBeEdited) ||
        false)
    );
  }

  /**
   * Returns a boolean indication whether the Status of the specified Item
   * can be updated during the submission of the Multieditor.
   *
   * @internal
   * @param item - Item
   */
  public canAssignStatusToItemOnSubmit(item: Item): boolean {
    return (
      (this.config.reValidateMode === 'onSubmit' ||
        (this.config.reValidateMode === 'afterFirstSubmit' &&
          !this.submitted) ||
        (this.config.reValidateMode === 'onChange' &&
          !item.status.config.display)) &&
      (this.config.toValidate === 'all' ||
        (this.config.toValidate === 'editable' && item.config.canBeEdited) ||
        false)
    );
  }

  /**
   * Returns a boolean indication whether the Status of the specified Item
   * can be updated during the blur of the Item.
   *
   * @internal
   * @param item - Item
   */
  public canAssignStatusToItemOnBlur(item: Item): boolean {
    return (
      this.config.reValidateMode === 'onBlur' &&
      (this.config.toValidate === 'all' ||
        (this.config.toValidate === 'editable' && item.config.canBeEdited) ||
        false)
    );
  }
}
