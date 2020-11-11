import { defineConfig, State } from "@agile-ts/core";
import { MultiEditor, Validator, Status, ItemKey } from "./internal";

export class Item<DataType = any> extends State<DataType> {
  public editor: () => MultiEditor<DataType>;

  public isValid: boolean = false;
  public config: ItemConfigInterface;

  public status: Status;
  public validator: Validator<DataType>;

  /**
   * @public
   * Item - Item of an Editor
   * @param editor - Editor to which the Item belongs
   * @param data - Data that the Item holds
   * @param key - Key/Name of Item
   * @param config - Config
   */
  constructor(
    editor: MultiEditor<DataType>,
    data: DataType,
    key: ItemKey,
    config: ItemConfigInterface = {}
  ) {
    super(editor.agileInstance(), data, key);
    config = defineConfig(config, {
      canBeEdited: true,
    });
    this.editor = () => editor;
    this.validator = editor.getValidator(key);
    this.config = config;
    this.status = new Status(this);

    // Add SideEffect that rebuilds the Status depending of the Item value
    this.addSideEffect("validateItem", async () => {
      this.isValid = await this.validator.validate(key, this.value);
      this.status.display = true;
      this.editor().validate();
      this.editor().updateIsModified();
    });
  }

  //=========================================================================================================
  // Validate
  //=========================================================================================================
  /**
   * @public
   * Validates Item and updates the isValid property
   */
  public async validate(): Promise<boolean> {
    const isValid = this.key
      ? await this.validator.validate(this.key, this.value)
      : false;
    this.isValid = isValid;
    return isValid;
  }
}

/**
 * @param canBeEdited - If Item gets passed into the preparedData on Submit (if it got edited)
 */
export interface ItemConfigInterface {
  canBeEdited?: boolean;
}