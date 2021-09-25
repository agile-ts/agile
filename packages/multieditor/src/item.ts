import { StateRuntimeJobConfigInterface, State } from '@agile-ts/core';
import { isFunction, defineConfig } from '@agile-ts/utils';
import { ItemKey, Multieditor } from './multieditor';
import { Status } from './status';
import { Validator } from './validator';
import { logCodeManager } from './logCodeManager';

export class Item<ValueType = any> extends State<ValueType> {
  // Multieditor the Item belongs to
  public editor: () => Multieditor<ValueType>;

  public config: ItemConfigInterface;

  // Whether the Item value is valid
  public isValid = false;
  // Handles the validation of the Item
  public validator: Validator<ValueType>;
  // Handles and represents the validation Status of the Item
  public status: Status;

  // Method for dynamically computing the Item value
  public computeValueMethod?: ComputeValueMethod<ValueType>;

  /**
   * An Item represents a piece of information from the Multieditor.
   *
   * @public
   * @param editor - Multieditor to which the Item belongs.
   * @param initialValue - Initial value of the Item.
   * @param config - Configuration object
   */
  constructor(
    editor: Multieditor<ValueType>,
    initialValue: ValueType,
    config: ItemConfigInterface
  ) {
    super(editor.agileInstance(), initialValue, {
      key: config.key,
    });
    config = defineConfig(config, {
      canBeEdited: true,
      validator: new Validator(),
    });
    this.editor = () => editor;
    this.validator = config.validator as any;
    this.config = config;
    this.status = new Status(this);

    // Add side effect to revalidate the Item on every Item value change
    this.addSideEffect('validateItem', async () => {
      await this.validate();

      if (this.editor().canAssignStatusToItemOnChange(this))
        this.status.display = true;

      // Recompute Multieditor states
      this.editor().recomputeValidatedState({ validate: false });
      this.editor().recomputeModifiedState();
    });
  }

  /**
   * Revalidates the Item via the Validator
   * and updates the 'isValid' state.
   *
   * @public
   */
  public async validate(): Promise<boolean> {
    const isValid = await this.validator.validate(this, this.value);
    this.isValid = isValid;
    return isValid;
  }

  /**
   * Resets the Item value to its initial value.
   *
   * @public
   * @param config - Configuration object
   */
  public reset(config: StateRuntimeJobConfigInterface = {}): this {
    this.set(this.initialStateValue, config);
    this.status.display = false;
    return this;
  }

  /**
   * Defines the method used to compute the value of the Item.
   *
   * It is retrieved on each Item value change,
   * in order to compute the new Item value
   * based on the specified compute method.
   *
   * @public
   * @param method - Method to compute the value of the Item.
   */
  public computeValue(method: ComputeValueMethod<ValueType>): this {
    if (!isFunction(method)) {
      logCodeManager.log('00:03:01', ['Compute Value Method', 'function']);
      return this;
    }
    this.computeValueMethod = method;

    // Initial compute
    // (not directly computing it here since it is computed once in the runtime!)
    this.set(this.nextStateValue);

    return this;
  }
}

export interface ItemConfigInterface {
  /**
   * Key/Name identifier of the Item.
   */
  key: ItemKey;
  /**
   * Whether the Item value can be edited
   * and thus should be represented in the 'preparedData' object when submitting.
   * @default true
   */
  canBeEdited?: boolean;
  /**
   * Validator to handle validating the Item.
   * @default newly create Validator
   */
  validator?: Validator;
}

export type ComputeValueMethod<T = any> = (value: T) => T;
