---
'@agile-ts/api': patch
'@agile-ts/core': patch
'cra-template-agile': patch
'cra-template-agile-typescript': patch
'@agile-ts/event': patch
'@agile-ts/logger': patch
'@agile-ts/multieditor': patch
'@agile-ts/proxytree': patch
'@agile-ts/react': patch
'@agile-ts/utils': patch
'@agile-ts/vue': patch
---

#### ❗️ Breaking Change

```ts
MY_STATE.persist('persistKey'); -> MY_STATE.persist({key: 'persistKey'});
```

#### :rocket: New Feature
* `core`
    * [#214](https://github.com/agile-ts/agile/pull/214) add migration callback ([@bennodev19](https://github.com/bennodev19))

#### :nail_care: Polish
* `logger`
    * [#210](https://github.com/agile-ts/agile/pull/210) Refactor logger ([@bennodev19](https://github.com/bennodev19))
* `api`, `core`, `event`, `logger`, `multieditor`, `proxytree`, `react`, `utils`, `vue`
    * [#209](https://github.com/agile-ts/agile/pull/209) Outsource react hooks ([@bennodev19](https://github.com/bennodev19))

#### Committers: 1
- BennoDev ([@bennodev19](https://github.com/bennodev19))

