import { defineConfig, State } from "@agile-ts/core";
import MultiEditor from "./index";
import { Validator } from "./validator";

export class Item<DataType = any> extends State<DataType> {
  public editor: () => MultiEditor<DataType>;
  public status: StatusInterface | null = null;
  public isValid: boolean = false;
  public validator: Validator<DataType>;
  public isPrepared: boolean = false;
  public canBeEdited: boolean = false;

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

    // Call ValidateMethods of Validator for first time
    this.validator
      .validate(key, this.value)
      .then((isValid) => (this.isValid = isValid));

    // Add SideEffect that builds the Status depending on the validationMethod
    this.addSideEffect("buildStatus", async () => {
      this.isValid = await this.validator.validate(key, this.value);
      await this.editor().validate();
    });
  }
}

export type StatusType = "error" | "success";

/**
 * @param type - Type of the Status
 * @param message - Message of the Status
 */
export interface StatusInterface {
  type: StatusType;
  message: string;
}

export interface ItemConfigInterface {
  key?: boolean;
  canBeEdited?: boolean;
}
