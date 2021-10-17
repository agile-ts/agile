# [WIP] Multi Editor

> Simple Form Manager for UI-Frameworks

 <a href="https://agile-ts.org">
   <img src="https://img.shields.io/badge/Status-Alpha-green.svg" alt="Status"/>
 </a>
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
  

## 👀 Example
```ts
// Create Multieditior 
const multiEditor = createMultieditor(editor => ({
  initialData: {
    id: "myId", // Initial Id
    email: undefined, // Inital Email
    name: undefined, // Inital Name
  },
  onSubmit: async (data) => {
    console.log("Submitted ", data);  // <---------
  }, //                                           |
  // Properties that are always passed to the 'onSubmit()' method
  fixedProperties: ["id"],
  validationSchema: {
    // Validation with inbuilt tree shakable validation methods
    email: agileResolver(isString, isEmail, isRequired),
    // Validation with external validatiors like Yup
    name: yupResolver(Yup.string().required().max(10).min(2)),
  }
}));

// Use the Multieditor in any UI-Form
// ..
<label>First Name:</label>
<input
onChange={(e) => signUpEditor.setValue("firstName", e.target.value)}
defaultValue={signUpEditor.getItemInitialValue("firstName")}
/>
<ErrorMessage error={signUpEditor.getStatus("firstName")?.message} />
// ..

// Submit Multieditor and see what the 'onSubmit()' method will log
multiEditor.submit();
// Submited {
//   id: "myId",
//   name: "Jeff",
//   email: "test@test.com"
// }
```

### ⛳️ Sandbox
Test the Multieditor yourself in a [codesandbox](https://codesandbox.io/s/multieditor-yxt4x).
It's only one click away. Just select your preferred Framework below.

- [React](https://codesandbox.io/s/multieditor-yxt4x)

More examples can be found in the [Example section](https://agile-ts.org/docs/examples).


## ❓ Why Multieditor

#### 🚅 Straightforward
Write minimalistic, boilerplate-free code that captures your intent.
```ts
// Simple and tree shakable inbuilt validation
agileResolver(isRequired, isString('custom error message'), isEmail);

// Easy integration with external validation libraries like Yup
yupResolver(Yup.string().email());

// Easy value compution
computeMethods: {
  name: (value) => {
    return value.toLowerCase();
  }
}
```

### 🤸‍ Flexible
- Works in nearly any UI-Framework (currently supported are [React](https://reactjs.org/), [React-Native](https://reactnative.dev/) and [Vue](https://vuejs.org/)).
- Surly behaves with the workflow that suits you best.
- Has **0** external dependencies.

### ⚡️ Fast
Minimizes the number of re-renders
and validate computation.


## ⬇️ Installation
```
npm install @agile-ts/multieditor
```
The `multieditor` package is an extension of AgileTs and doesn't work without the [`core`](https://agile-ts.org/docs/core) package,
which functions as the brain of AgileTs and is indispensable.
Unfortunately, we can't combine each `core` with `multieditor` version.
Therefore, we have created a table which shows which versions fit together without restrictions.

| @agile-ts/multieditor | @agile-ts/core          | NPM Version              |
| ----------------------| ----------------------- | ------------------------ |
| v0.0.22+              | v0.2.5+                 | v6+                      |

_Other Versions aren't supported anymore_


## 📄 Documentation
Does the Multieditor sound interesting to you?
Take a look at our **[documentation](https://agile-ts.org/docs/introduction)**,
to learn more about its functionalities and capabilities.
If you have any further questions,
feel free to join our [Community Discord](https://discord.gg/T9GzreAwPH).
We will be happy to help you.


## 👨‍💻 Contribute
Get a part of AgileTs and start contributing. We welcome any meaningful contribution. 😀
To find out more about contributing, check out the [CONTRIBUTING.md](https://github.com/agile-ts/agile/blob/master/CONTRIBUTING.md).

<a href="https://codeclimate.com/github/agile-ts/agile/coverage.svg">
   <img src="https://codeclimate.com/github/agile-ts/agile/badges/gpa.svg" alt="Maintainability"/>
</a>

### ♥️ Contributors

<a href="https://github.com/agile-ts/agile/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=agile-ts/agile" />
</a>

[Become a contributor](https://github.com/agile-ts/agile/blob/master/CONTRIBUTING.md)

