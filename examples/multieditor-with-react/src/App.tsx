import React from "react";
import "./App.css";
import ErrorMessage from "./components/ErrorMessage";
import { useAgile } from "@agile-ts/react";
import { signUpEditor } from "./core/signUpEditor";
import { generateColor, generateId } from "./core/utils";

const App = () => {
  useAgile(signUpEditor.deps);

  return (
    <form
      onSubmit={async (event) => {
        event.preventDefault();
        console.log(signUpEditor);
        await signUpEditor.submit();
      }}
    >
      <h1>Sign Up</h1>
      <label>First Name:</label>
      <input
        onChange={(e) => signUpEditor.setValue("firstName", e.target.value)}
      />
      <ErrorMessage error={signUpEditor.getStatus("firstName")?.message} />

      <label>Last Name:</label>
      <input
        onChange={(e) =>
          signUpEditor.setValue("lastName", e.target.value, {
            background: false,
          })
        }
        value={signUpEditor.getValueById("lastName")}
      />
      <ErrorMessage error={signUpEditor.getStatus("lastName")?.message} />

      <label>Gender</label>
      <select onChange={(e) => signUpEditor.setValue("gender", e.target.value)}>
        <option selected value={""}>
          Select...
        </option>
        <option value="male">Male</option>
        <option value="female">Female</option>
      </select>
      <ErrorMessage error={signUpEditor.getStatus("gender")?.message} />

      <label>Username</label>
      <input
        onChange={(e) => signUpEditor.setValue("userName", e.target.value)}
      />
      <ErrorMessage error={signUpEditor.getStatus("userName")?.message} />

      <label>Email</label>
      <input onChange={(e) => signUpEditor.setValue("email", e.target.value)} />
      <ErrorMessage error={signUpEditor.getStatus("email")?.message} />

      <label>Age</label>
      <input onChange={(e) => signUpEditor.setValue("age", e.target.value)} />
      <ErrorMessage error={signUpEditor.getStatus("age")?.message} />

      <label>About you</label>
      <textarea
        onChange={(e) => signUpEditor.setValue("aboutYou", e.target.value)}
      />
      <ErrorMessage error={signUpEditor.getStatus("aboutYou")?.message} />

      <label>Image</label>
      <div
        style={{ display: "flex", flexDirection: "row", alignItems: "center" }}
      >
        <div
          style={{
            backgroundColor: signUpEditor.getValueById("image")?.color,
            width: 100,
            height: 100,
            borderRadius: 100,
          }}
        />
        <button
          style={{ marginLeft: 50 }}
          onClick={() => {
            signUpEditor.setValue(
              "image",
              {
                id: generateId(),
                color: generateColor(),
              },
              { background: false }
            );
          }}
        >
          Reset Image
        </button>
      </div>
      <ErrorMessage error={signUpEditor.getStatus("image")?.message} />

      <input type="submit" />
    </form>
  );
};

export default App;
