import { Agile } from "@agile-ts/core";
import MultiEditor from "../src";

const App = new Agile();

const multiEditor = new MultiEditor<string, boolean>(App, (editor) => ({
  data: {
    id: "",
    email: undefined,
    name: undefined,
  },
  onSubmit: async (data) => {
    console.log("Submitted");
    return Promise.resolve(true);
  },
  fixedProperties: ["id"],
  validateMethods: {
    email: editor.Validator().email(),
    name: editor.Validator().maxLength(10).minLength(2),
  },
  editableProperties: ["email", "name"],
}));
