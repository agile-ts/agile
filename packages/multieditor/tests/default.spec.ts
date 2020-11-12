import { Agile } from "@agile-ts/core";
import { MultiEditor } from "../src/multieditor";

const App = new Agile();
/*
const multiEditor = new MultiEditor<string, boolean>(App, (editor) => ({
  data: {
    id: "myId",
    email: undefined,
    name: undefined,
  },
  onSubmit: async (data) => {
    console.log("Submitted ", data);
    return Promise.resolve(true);
  },
  fixedProperties: ["id"],
  validateMethods: {
    email: editor.Validator().string().email().required(),
    name: editor.Validator().string().max(10).min(2).required(),
  },
  editableProperties: ["email", "name"],
}));
 */
