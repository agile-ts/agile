import React from "react";
import MultiEditor, { Validator } from "@agile-ts/multieditor";
import "./App.css";
import ErrorMessage from "./components/ErrorMessage";
import AgileInstance from "./core/agile";

const isValidNameValidator = new Validator()
  .required()
  .string()
  .min(2)
  .max(10)
  .matches(/^([^0-9]*)$/);

const signUpEditor = new MultiEditor(
  (editor) => ({
    data: {
      id: "myCoolId",
      firstName: "",
      lastName: "",
      gender: null,
      userName: "",
      email: "",
      aboutYou: "",
      age: null,
    },
    onSubmit: async (preparedData) => {
      alert(JSON.stringify(preparedData));
    },
    validateMethods: {
      firstName: isValidNameValidator,
      lastName: isValidNameValidator,
      userName: isValidNameValidator
        .copy()
        .addValidationMethod(async (key, value, editor) => {
          const isValid = value === "Jeff";
          if (!isValid)
            editor.setStatus(
              key,
              "error",
              "Sry only the name Jeff is allowed!"
            );
          return isValid;
        }),
      email: editor.Validator().required().string().email(),
      aboutYou: editor
        .Validator()
        .string()
        .min(10)
        .addValidationMethod(async (key, value, editor) => {
          const isValid = typeof value === "string" && value.includes("fuck");
          if (!isValid)
            editor.setStatus(key, "error", "The word fuck is not allowed!");
          return isValid;
        }),
      age: editor.Validator().required().number().min(18).max(100),
    },
    computeMethods: {
      lastName: (value) =>
        typeof value === "string" ? value.toUpperCase() : value,
    },
    fixedProperties: ["id"],
    reValidateMode: "afterFirstSubmit",
  }),
  AgileInstance
);

const App = () => {
  return (
    <form
      className="App"
      onSubmit={async () => {
        await signUpEditor.submit();
      }}
    >
      <h1>Sign Up</h1>
      <label>First Name:</label>
      <input
        name="firstName"
        onChange={(e) => signUpEditor.setValue("firstName", e.target.value)}
      />
      <ErrorMessage error={signUpEditor.getStatus("firstName")?.message} />

      <label>Last Name:</label>
      <input
        name="lastName"
        onChange={(e) => signUpEditor.setValue("lastName", e.target.value)}
        value={signUpEditor.getValueById("lastName")}
      />
      <ErrorMessage error={signUpEditor.getStatus("lastName")?.message} />

      <label>Gender</label>
      <select
        name="gender"
        onChange={(e) => signUpEditor.setValue("gender", e.target.value)}
      >
        <option value="">Select...</option>
        <option value="male">Male</option>
        <option value="female">Female</option>
      </select>
      <ErrorMessage error={signUpEditor.getStatus("gender")?.message} />

      <label>Username</label>
      <input
        name="username"
        onChange={(e) => signUpEditor.setValue("username", e.target.value)}
      />
      <ErrorMessage error={signUpEditor.getStatus("username")?.message} />

      <label>Email</label>
      <input
        name="email"
        onChange={(e) => signUpEditor.setValue("email", e.target.value)}
      />
      <ErrorMessage error={signUpEditor.getStatus("email")?.message} />

      <label>Age</label>
      <input
        name="age"
        onChange={(e) => signUpEditor.setValue("age", e.target.value)}
      />
      <ErrorMessage error={signUpEditor.getStatus("age")?.message} />

      <label>About you</label>
      <textarea
        name="aboutyou"
        onChange={(e) => signUpEditor.setValue("aboutYou", e.target.value)}
      />
      <ErrorMessage error={signUpEditor.getStatus("aboutYou")?.message} />

      <input type="submit" />
    </form>
  );
};

export default App;
