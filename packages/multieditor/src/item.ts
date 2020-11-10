import { defineConfig, State } from "@agile-ts/core";
import MultiEditor from "./index";
import { Validator } from "./validator";
import { Status, StatusInterface } from "./status";

export class Item<DataType = any> extends State<DataType> {
  public editor: () => MultiEditor<DataType>;

  public isValid: boolean = false;
  public validator: Validator<DataType>;
  public canBeEdited: boolean = false;

  public _status: Status;
  public showStatus: boolean = false;

  /**
   * @public
   * Item of an Editor
   */
  constructor(
    editor: MultiEditor<DataType>,
    data: DataType,
    key: string,
    config: ItemConfigInterface = {}
  ) {
    super(editor.agileInstance(), data, key);
    config = defineConfig(config, {
      canBeEdited: true,
    });
    this.editor = () => editor;
    this.validator = editor.getValidator(key);
    this.canBeEdited = config.canBeEdited || false;
    this._status = new Status(this);

    // Add SideEffect that builds the Status depending on the Validator
    this.addSideEffect("validateItem", async () => {
      this.isValid = await this.validator.validate(key, this.value);
      this.showStatus = true;
      this.editor().validate();
      this.editor().updateIsModified();
    });
  }

  /**
   * @public
   * Get Status of Item
   */
  public get status(): StatusInterface | null {
    return (this.showStatus && this._status.status) || null;
  }

  //=========================================================================================================
  // Validate
  //=========================================================================================================
  /**
   * @public
   * Validates Item and sets its isValid property
   */
  public async validate(): Promise<boolean> {
    const isValid = await this.validator.validate(
      this.key || "unknown",
      this.value
    );
    this.isValid = isValid;
    return isValid;
  }
}

/**
 * @param canBeEdited - If Item can be Edited
 */
export interface ItemConfigInterface {
  canBeEdited?: boolean;
}
