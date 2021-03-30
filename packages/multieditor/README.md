# [WIP] Multi Editor

> Simple Form Manager for UI-Frameworks

<a href="https://npm.im/@agile-ts/multieditor">
  <img src="https://img.shields.io/npm/v/@agile-ts/multieditor.svg" alt="npm version"/></a>
 <a href="https://github.com/agile-ts/agile">
  <img src="https://img.shields.io/github/license/agile-ts/agile.svg" alt="GitHub License"/></a>
<a href="https://npm.im/@agile-ts/multieditor">
  <img src="https://img.shields.io/npm/dm/@agile-ts/multieditor.svg" alt="npm monthly downloads"/></a>
<a href="https://npm.im/@agile-ts/multieditor">
  <img src="https://img.shields.io/npm/dt/@agile-ts/multieditor.svg" alt="npm total downloads"/></a>
<a href="https://npm.im/@agile-ts/multieditor">
  <img src="https://img.shields.io/bundlephobia/min/@agile-ts/multieditor.svg" alt="npm minified size"/></a>
  

## ⏰ Short Example
```ts
// Let's create our MultiEditor
const multiEditor = new MultiEditor(editor => ({
  data: {
    id: "myId", // Inital Id
    email: undefined, // Inital Email
    name: undefined, // Inital Name
  },
  onSubmit: async (data) => {
    console.log("Submitted ", data);  // <-------------------------------------------    
  },                                                                  //            |
  fixedProperties: ["id"], // Properties that always get passed as data into the onSubmit function
  validateMethods: {
    email: editor.Validator().string().email().required(), // Email is requiered, a string and follows the Email regex
    name: editor.Validator().string().max(10).min(2).required(), // Name is required, a string, has to be shorter than 10 and longer than 2 chars
  },
  editableProperties: ["email", "name"], // Properties that can be edited
}));

// Lets update the requiered properties to validate the Editor
multiEditor.setValue("email", "test@test.com");
multiEditor.setValue("name", "Jeff");

// Now we can submit the Editor and see what the onSubmit will log
multiEditor.submit();
// Submited {
//   id: "myId",
//   name: "Jeff",
//   email: "test@test.com"
// }
```
_Do you want to see it in action? Click [here](https://codesandbox.io/s/multieditor-yxt4x)._

## ❓ Why Agile MultiEditor

#### 🚅 Straightforward
Write minimalistic, boilerplate free code that captures your intent. <br />
**For instance**
- Simple Validation
  ```ts
  // Email is requiered, a string and follows the Email regex
  EDITOR.Validator().string().email().required()
  ```
- Compute Value
  ```ts
  // Force Name to be lowercase
  name: (value) => {
        return value.toLowerCase();
      }
  ```


#### 🎯 Easy to Use
Learn the powerful and simple tools of Agile MultiEditor in a short amount of time.


#### 🍃 Lightweight
Agile Api has an unpacked size of [14.1kB](https://bundlephobia.com/result?p=@agile-ts/multieditor@0.0.6)
and [0 external dependencies](https://www.npmjs.com/package/@agile-ts/multieditor).


## ⬇️ Installation
```
npm install @agile-ts/multieditor
```
The `multieditor` package is an extension of AgileTs and doesn't work without the [`core` package](../core/Introduction.md),
which functions as the brain of AgileTs and is indispensable.
Unfortunately, we can't combine each `core` with `multieditor` version.
Therefore, we have created a table which shows which versions fit together without restrictions.

| @agile-ts/multieditor | @agile-ts/core          | NPM Version              | Supported React versions |
| ----------------------| ----------------------- | ------------------------ | -------------------------|
| v0.0.7+               | v0.0.7+                 | v6+                      | 16.8+                    |
| v0.0.6                | v0.0.3 - v0.0.6         | v6+                      | 16.8+                    | 
_Other Versions aren't supported anymore_


## 📄 Documentation
The Agile MultiEditor Docs are located [here](https://agile-ts.org/docs/)
