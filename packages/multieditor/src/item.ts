import {
  StateRuntimeJobConfigInterface,
  defineConfig,
  State,
} from '@agile-ts/core';
import { ItemKey, Multieditor } from './multieditor';
import { Status } from './status';
import { Validator } from './validator';

export class Item<ValueType = any> extends State<ValueType> {
  // Multieditor the Item belongs to
  public editor: () => Multieditor<ValueType>;

  public config: ItemConfigInterface;

  // Whether the Item is valid.
  public isValid = false;
  // Handles the validation of the Item
  public validator: Validator<ValueType>;
  // Validation Status of the Item
  public status: Status;

  /**
   * An Item represents a piece of information from the Multieditor.
   *
   * @public
   * @param editor - Multieditor to which the Item belongs.
   * @param initialValue - Data that the Item holds
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
    });
    this.editor = () => editor;
    this.validator = editor.getValidator(config.key);
    this.config = config;
    this.status = new Status(this);

    // Add side effect to revalidate the Item on every Item value change
    this.addSideEffect('validateItem', async () => {
      await this.validate();

      if (this.editor().canAssignStatusToItemOnChange(this))
        this.status.display = true;
      this.editor().validate();
      this.editor().updateIsModified();
    });
  }

  /**
   * Revalidates the Item.
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
   *
   * @public
   * @param config - Configuration object
   */
  public reset(config: StateRuntimeJobConfigInterface = {}): this {
    this.set(this.initialStateValue, config);
    this.status.display = false;
    return this;
  }
}

export interface ItemConfigInterface {
  /**
   * Key/Name identifier of the State.
   */
  key: ItemKey;
  /**
   * @param canBeEdited - Whether the Item value can be edited
   * and thus is passes into the 'preparedData' object when submitting.
   * @default true
   */
  canBeEdited?: boolean;
}
