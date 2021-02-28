 <img src="https://raw.githubusercontent.com/agile-ts/agile/master/static/header_background.png" alt="AgileTs">
 
 > **Spacy, Simple, Scalable State Management Framework**
 
 <br />
  
<p align="left">
 <a href="https://github.com/agile-ts/agile">
   <img src="https://img.shields.io/github/license/agile-ts/agile.svg?label=license&style=flat&colorA=293140&colorB=4a4872" alt="GitHub License"/>
 </a>
 <a href="https://npm.im/@agile-ts/core">
   <img src="https://img.shields.io/bundlephobia/min/@agile-ts/core.svg?label=bundle%20size&style=flat&colorA=293140&colorB=4a4872" alt="npm minified size"/>
 </a>
 <a href="https://npm.im/@agile-ts/core">
   <img src="https://img.shields.io/npm/dt/@agile-ts/core.svg?label=downloads&style=flat&colorA=293140&colorB=4a4872" alt="npm total downloads"/>
 </a>
</p>

<p align="left">
 <a href="https://github.com/agile-ts/agile/actions?query=workflow%3ARelease">
   <img src="https://github.com/agile-ts/agile/workflows/Release/badge.svg" alt="Build Status"/>
 </a>
 <a href="https://github.com/agile-ts/agile/actions?query=workflow%3A%22Test+All+Packages%22">
   <img src="https://github.com/agile-ts/agile/workflows/Test%20All%20Packages/badge.svg" alt="Build Status"/>
 </a>
 <a href="https://coveralls.io/github/agile-ts/agile?branch=master">
   <img src="https://coveralls.io/repos/github/agile-ts/agile/badge.svg?branch=master" alt="Coverage Badge"/>
 </a>
</p>

<p align="left">
 <a href="https://twitter.com/intent/tweet?text=I%20just%20discovered%20AgileTs%3B%20an%20awesome%2C%20spacy%20and%20overall%20easy%20to%20use%20State%20Manager.%0A%60%60%60ts%0Aconst%20MY_STATE%20%3D%20App.createState(%22Hello%20stranger%22)%3B%0AMY_STATE.set(%22Hello%20friend%22)%3B%0A%60%60%60%0Ahttps%3A%2F%2Fgithub.com%2Fagile-ts%2Fagile%2F"><img src="http://randojs.com/images/tweetShield.svg" alt="Tweet" height="20"/>
 </a>
 <a href="https://discord.gg/T9GzreAwPH">
   <img src="https://img.shields.io/discord/795291052897992724.svg?label=&logo=discord&logoColor=ffffff&color=7389D8&labelColor=6A7EC2" alt="Join Discord"/>
 </a>
</p> 

<br />
<img src="https://raw.githubusercontent.com/agile-ts/agile/master/static/how_to_create_state_header.png" alt="How to create a State?"/>

```tsx
// -- core.js ------------------------------------------

// Let's start by creating an Instance of AgileTs
const App = new Agile();

// Now we are able to build our first State 😃
const MY_FIRST_STATE = App.createState("Hello Stranger!");


// -- myComponent.whatever ------------------------------------------

// Finally, we bind our just created State to our desired UI-Component
// And wolla its reactive. Everytime the State mutates the Component gets rerendered
const myFirstState = useAgile(MY_FIRST_STATE); // returns value of State ("Hello Stranger!")
```
To find out more checkout our [documentation](https://agile-ts.org/docs/installation).

### ⛳️ Sandbox
Test AgileTs yourself, it's only one click away. Just select your preferred Framework below.
- [React](https://codesandbox.io/s/agilets-first-state-f12cz)
- Vue (coming soon)
- Angular (coming soon)


<br />


<br />
<img src="https://raw.githubusercontent.com/agile-ts/agile/master/static/why_should_i_use_agile.png" alt="Why should I use AgileTs?"/>

### 🚅 Straightforward
Write minimalistic, boilerplate free code that captures your intent. 

**Some straightforward syntax examples:**
- Store State in the Local Storage
  ```ts
  MY_STATE.persist("storage-key")
  ```
- Create reactive Collection of States
  ```ts
  const MY_COLLECTION = App.Collection();
  MY_COLLECTION.collect({id: 1, name: "Frank"});
  MY_COLLECTION.collect({id: 2, name: "Dieter"});
  ```
- Mutate or Check States with simple Functions
  ```ts
  MY_STATE.undo(); // Undo last change
  MY_STATE.is({hello: "jeff"}); // Check if State has the Value {hello: "jeff"}
  ```

### 🤸‍ Flexible
- Works in nearly every UI-Framework. Check [here](https://agile-ts.org/docs/installation) if your desired framework is supported, too.
- Surly behaves with the workflow that suits you best.
  No need for _reducers_, _actions_, ..
- Has **no** external dependencies

### 🌌 Centralize
Manage your Application Logic in a central place outside any UI-Framework.
This makes your code more decoupled, portable, and above all, easily testable.

### 🎯 Easy to Use
Learn the powerful tools of AgileTs in a short amount of time.
A good place to start is in our [documentation](https://agile-ts.org/docs).
And I'm sure you'll be able to use AgileTs very soon.

### 🍃 Lightweight
AgileTs has an unpacked size of [52.7kB](https://bundlephobia.com/result?p=@agile-ts/core@0.0.6) 
and [0 dependencies](https://www.npmjs.com/package/@agile-ts/core).


<br />


<br />
<img src="https://raw.githubusercontent.com/agile-ts/agile/master/static/installation_header.png" alt="Installation"/>

To properly use AgileTs, in an UI-Framework we need **two** packages.

- The _Core Package_, which acts as the brain of AgileTs and manages all our States
  ```
  npm install @agile-ts/core
  ```

- And a _fitting Integration_ for our preferd UI-Framework.. in my case [React](https://www.npmjs.com/package/@agile-ts/react).
  Check [here](https://agile-ts.org/docs/installation) if your desired Framework is supported, too.
  ```
  npm install @agile-ts/react
  ```
  

<br />


<br />
<img src="https://raw.githubusercontent.com/agile-ts/agile/master/static/documentation_header.png" alt="Documentation"/>

If AgileTs sounds interesting to you.
Checkout our **[docs](https://agile-ts.org/docs/)**. 
And I am sure you will be able to use it in no time.
In case you have any questions don't mind joining our [Discord Community](https://discord.gg/FTqeMNCxw7).


<br />


<br />
<img src="https://raw.githubusercontent.com/agile-ts/agile/master/static/contribute_header.png" alt="Contribute"/>

Get a part of AgileTs and start contributing. 
To find out more checkout the [CONTRIBUTING.md](https://github.com/agile-ts/agile/blob/master/CONTRIBUTING.md).
We welcome any meaningful contribution 😀

<a href="https://codeclimate.com/github/agile-ts/agile/coverage.svg">
   <img src="https://codeclimate.com/github/agile-ts/agile/badges/gpa.svg" alt="Maintainability"/>
</a>


<br />


<br />
<img src="https://raw.githubusercontent.com/agile-ts/agile/master/static/packages_of_agile.png" alt="Packages of Agile"/>

| Name                                                                     |                                                                               Latest Version                                                                                | Description                               |
| ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| [@agile-ts/core](/packages/core)                                         |               [![badge](https://img.shields.io/npm/v/@agile-ts/core.svg?style=flat-square)](https://www.npmjs.com/package/@agile-ts/core)                                   | Brain of Agile                            |
| [@agile-ts/react](/packages/react)                                       |               [![badge](https://img.shields.io/npm/v/@agile-ts/react.svg?style=flat-square)](https://www.npmjs.com/package/@agile-ts/react)                                 | React Integration                         |
| [@agile-ts/api](/packages/api)                                           |               [![badge](https://img.shields.io/npm/v/@agile-ts/api.svg?style=flat-square)](https://www.npmjs.com/package/@agile-ts/api)                                     | Promise based Api                         |
| [@agile-ts/multieditor](/packages/multieditor)                           |               [![badge](https://img.shields.io/npm/v/@agile-ts/multieditor.svg?style=flat-square)](https://www.npmjs.com/package/@agile-ts/multieditor)                     | Simple Form Manager                       |


<br />


<br />
<img src="https://raw.githubusercontent.com/agile-ts/agile/master/static/credits_header.png" alt="Credits"/>

AgileTs is inspired by [PulseJs](https://github.com/pulse-framework/pulse)
