# [INTERNAL] Logger

> Simple Javascript Logger

 <br />

<a href="https://github.com/agile-ts/agile">
  <img src="https://img.shields.io/github/license/agile-ts/agile.svg?label=license&style=flat&colorA=293140&colorB=4a4872" alt="GitHub License"/></a>
<a href="https://npm.im/@agile-ts/logger">
  <img src="https://img.shields.io/npm/v/@agile-ts/logger.svg?label=npm&style=flat&colorA=293140&colorB=4a4872" alt="npm version"/></a>
<a href="https://npm.im/@agile-ts/logger">
  <img src="https://img.shields.io/bundlephobia/min/@agile-ts/logger.svg?label=minified%20size&style=flat&colorA=293140&colorB=4a4872" alt="npm minified size"/></a>
<a href="https://npm.im/@agile-ts/logger">
  <img src="https://img.shields.io/npm/dt/@agile-ts/logger.svg?label=downloads&style=flat&colorA=293140&colorB=4a4872" alt="npm total downloads"/></a>

<br />

## ❓ What is it for?

The Logger is an internal library of [AgileTs](https://agile-ts.org).
Simply put, it is used to log messages into the `console`.
But why a custom Logger and not just using the primitive `console.log`?
Well, some reasons are:
- **filtered log messages** <br/>
  Filter log messages by tag or type in order to see only logs that matter right now.
- **styled log messages** (color, font-weight) <br/>
  Style log messages to make it easier to distinguish between different log types
  and recognise important log messages more quickly.
- **customized log messages** (prefix, timestamp) <br/>
  Customize log messages to identify searched logs more swiftly.
- **disable logs**

### ▶️ Use case in `AgileTs`

The `Logger Class` is used in many AgileTs packages, for:
- logging different types of log messages,
```ts
Agile.logger.log("I'm a log message!");
Agile.logger.debug("I'm a debug message!");
Agile.logger.info("I'm a info message!");
Agile.logger.warn("I'm a warn message!");
Agile.logger.error("I'm a error message!");
Agile.logger.success("I'm a success message!");
Agile.logger.trace("I'm a trace message!");
Agile.logger.custom('jeff', "I'm a custom jeff message!");
```
- filtering log messages by log types
```ts
Agile.logger.setLevel(Logger.level.WARN);
Agile.logger.debug('Boring Debug Message.'); // Doesn't get logged
Agile.logger.warn('Important Warning!'); // Does get log
```
- filtering log messages by tags
```ts
Agile.logger.if.tag(['runtime']).info(`Created Job '${job._key}'`, job);
```
- adding a prefix before each log message
```ts
Agile.logger.debug('Hello there!'); // Logs: 'Agile: Hello there!'
```
- quickly disabling all logs
```ts
Agile.logger.isActive = false;
Agile.logger.debug('Boring Debug Message.'); // Doesn't get logged
Agile.logger.warn('Important Warning!'); // Doesn't get logged
```

## 📄 Documentation

Sounds AgileTs interesting to you?
Checkout our **[documentation](https://agile-ts.org/docs/introduction)**, to learn more.
And I promise you, you will be able to use AgileTs in no time.
If you have any further questions, don't hesitate to join our [Community Discord](https://discord.gg/T9GzreAwPH).

## ⭐️ Contribute

Get a part of AgileTs and start contributing. We welcome any meaningful contribution. 😀
To find out more about contributing, check out the [CONTRIBUTING.md](https://github.com/agile-ts/agile/blob/master/CONTRIBUTING.md).

<a href="https://codeclimate.com/github/agile-ts/agile/coverage.svg">
   <img src="https://codeclimate.com/github/agile-ts/agile/badges/gpa.svg" alt="Maintainability"/>
</a>
