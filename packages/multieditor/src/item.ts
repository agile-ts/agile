import { defineConfig, State } from "@agile-ts/core";
import MultiEditor from "./index";

export class Item<DataType = any> extends State<DataType> {
  public editor: () => MultiEditor<DataType>;
  public status: StatusInterface | null = null;
  public isValid: boolean = false;
  public validationMethod: ValidationMethodInterface<DataType>;
  public isPrepared: boolean = false;
  public canBeEdited: boolean = false;

  constructor(
    editor: MultiEditor<DataType>,
    data: DataType,
    key: string,
    config: ItemConfigInterface = {}
  ) {
    super(editor.agileInstance(), data);
    config = defineConfig(config, {
      canBeEdited: true,
    });
    this.editor = () => editor;
    this.validationMethod = editor.getValidationMethod(key);
    this.canBeEdited = config.canBeEdited || false;

    // Call ValidateMethod for first time
    this.validationMethod(key, this.value).then(
      (isValid) => (this.isValid = isValid)
    );

    // Add SideEffect that builds the Status depending on the validationMethod
    this.addSideEffect("buildStatus", async () => {
      this.isValid = await this.validationMethod(key, this.value);
      await this.editor().validate();
    });
  }
}

export type StatusType = "error" | "success";
export type ValidationMethodInterface<DataType = any> = (
  key: string,
  value: DataType
) => Promise<boolean>;

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
