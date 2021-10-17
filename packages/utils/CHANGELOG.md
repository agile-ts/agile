# @agile-ts/utils

## 0.0.11

### Patch Changes

- 36b235a: #### ❗️ Breaking Change

  ```ts
  MY_STATE.persist('persistKey'); -> MY_STATE.persist({key: 'persistKey'});
  ```

  #### :rocket: New Feature

  - `core`
    - [#214](https://github.com/agile-ts/agile/pull/214) add migration callback ([@bennodev19](https://github.com/bennodev19))

  #### :nail_care: Polish

  - `logger`
    - [#210](https://github.com/agile-ts/agile/pull/210) Refactor logger ([@bennodev19](https://github.com/bennodev19))
  - `api`, `core`, `event`, `logger`, `multieditor`, `proxytree`, `react`, `utils`, `vue`
    - [#209](https://github.com/agile-ts/agile/pull/209) Outsource react hooks ([@bennodev19](https://github.com/bennodev19))

  #### Committers: 1

  - BennoDev ([@bennodev19](https://github.com/bennodev19))

## 0.0.10

### Patch Changes

- e6ef3a7: #### :bug: Bug Fix

  - `core`, `multieditor`, `react`
    - [#204](https://github.com/agile-ts/agile/pull/204) fix multieditor ([@bennodev19](https://github.com/bennodev19))
  - `api`, `core`, `cra-template-agile-typescript`, `cra-template-agile`, `event`, `logger`, `multieditor`, `proxytree`, `react`, `utils`, `vue`
    - [#201](https://github.com/agile-ts/agile/pull/201) fix commonjs bundle ([@bennodev19](https://github.com/bennodev19))

  #### Committers: 1

  - BennoDev ([@bennodev19](https://github.com/bennodev19))

## 0.0.9

### Patch Changes

- 488c87c: #### :nail_care: Polish

  - `api`, `core`, `cra-template-agile-typescript`, `cra-template-agile`, `event`, `logger`, `multieditor`, `proxytree`, `react`, `utils`, `vue`
    - [#194](https://github.com/agile-ts/agile/pull/194) Commonjs issue ([@bennodev19](https://github.com/bennodev19))
  - `core`
    - [#195](https://github.com/agile-ts/agile/pull/195) Removed `internal.ts` and resolved cycle dependencies ([@bennodev19](https://github.com/bennodev19))

  #### Committers: 1

  - BennoDev ([@bennodev19](https://github.com/bennodev19))

## 0.0.8

### Patch Changes

- aae6455: #### :rocket: New Feature

  - `core`, `event`, `logger`, `multieditor`, `react`, `utils`
    - [#188](https://github.com/agile-ts/agile/pull/188) Tree shakeable support ([@bennodev19](https://github.com/bennodev19))

  #### :nail_care: Polish

  - `core`
    - [#189](https://github.com/agile-ts/agile/pull/189) Optimize collection rebuilds ([@bennodev19](https://github.com/bennodev19))
  - `api`, `core`, `cra-template-agile-typescript`, `cra-template-agile`, `event`, `logger`, `multieditor`, `proxytree`, `react`, `utils`, `vue`
    - [#187](https://github.com/agile-ts/agile/pull/187) Tree shakeable support ([@bennodev19](https://github.com/bennodev19))

  #### Committers: 1

  - BennoDev ([@bennodev19](https://github.com/bennodev19))

## 0.0.7

### Patch Changes

- 2f2724f: #### :bug: Bug Fix

  - `core`
    - [#176](https://github.com/agile-ts/agile/pull/176) Fix persisting dynamically added items ([@bennodev19](https://github.com/bennodev19))

  #### :nail_care: Polish

  - `api`, `core`, `event`, `logger`, `multieditor`, `react`, `utils`
    - [#177](https://github.com/agile-ts/agile/pull/177) Optimize default configurations ([@bennodev19](https://github.com/bennodev19))

  #### Committers: 1

  - BennoDev ([@bennodev19](https://github.com/bennodev19))

## 0.0.6

### Patch Changes

- cef61b6: #### :rocket: New Feature

  - `react`
    - [#171](https://github.com/agile-ts/agile/pull/171) Add deps array to useAgile() hook ([@bennodev19](https://github.com/bennodev19))
  - `core`, `event`, `react`, `vue`
    - [#166](https://github.com/agile-ts/agile/pull/166) Shared Agile Instance ([@bennodev19](https://github.com/bennodev19))

  #### :nail_care: Polish

  - `api`, `core`, `event`, `logger`, `multieditor`, `react`, `utils`
    - [#168](https://github.com/agile-ts/agile/pull/168) Performance optimization ([@bennodev19](https://github.com/bennodev19))
  - `core`, `event`, `react`, `vue`
    - [#166](https://github.com/agile-ts/agile/pull/166) Shared Agile Instance ([@bennodev19](https://github.com/bennodev19))

  #### Committers: 1

  - BennoDev ([@bennodev19](https://github.com/bennodev19))

## 0.0.5

### Patch Changes

- 855a921: #### :rocket: New Feature

  - `core`, `multieditor`, `react`, `vue`
    - [#161](https://github.com/agile-ts/agile/pull/161) Subscribe to Group value or output ([@bennodev19](https://github.com/bennodev19))
  - `core`
    - [#160](https://github.com/agile-ts/agile/pull/160) added null option to Selector ([@bennodev19](https://github.com/bennodev19))
    - [#159](https://github.com/agile-ts/agile/pull/159) make compute method async compatible ([@bennodev19](https://github.com/bennodev19))

  #### :bug: Bug Fix

  - `core`
    - [#152](https://github.com/agile-ts/agile/pull/152) Fix remove selected Item loop ([@bennodev19](https://github.com/bennodev19))

  #### :nail_care: Polish

  - `core`, `multieditor`, `react`, `vue`
    - [#161](https://github.com/agile-ts/agile/pull/161) Subscribe to Group value or output ([@bennodev19](https://github.com/bennodev19))
  - `core`, `cra-template-agile-typescript`, `cra-template-agile`, `event`, `logger`, `multieditor`, `proxytree`, `react`, `utils`, `vue`
    - [#153](https://github.com/agile-ts/agile/pull/153) refactor core descriptions ([@bennodev19](https://github.com/bennodev19))
  - `core`, `event`, `react`, `vue`
    - [#154](https://github.com/agile-ts/agile/pull/154) Optimise Runtime ([@bennodev19](https://github.com/bennodev19))
  - `core`, `proxytree`
    - [#150](https://github.com/agile-ts/agile/pull/150) Outsource log messages ([@bennodev19](https://github.com/bennodev19))

  #### Committers: 1

  - BennoDev ([@bennodev19](https://github.com/bennodev19))

## 0.0.4

### Patch Changes

- 7aeadd5: #### :rocket: New Feature

  - `core`, `react`, `vue`
    - [#144](https://github.com/agile-ts/agile/pull/144) Vue integration ([@bennodev19](https://github.com/bennodev19))

  #### :nail_care: Polish

  - `core`, `react`, `vue`
    - [#144](https://github.com/agile-ts/agile/pull/144) Vue integration ([@bennodev19](https://github.com/bennodev19))
  - Fixed typos in ReadMe's

  #### Committers: 1

  - BennoDev ([@bennodev19](https://github.com/bennodev19))

## 0.0.3

### Patch Changes

- f561c34: - added move method
  - fixed 0 as itemKey issue
  - fixed computed tracking

## 0.0.2

### Patch Changes

- 616681d: - Outsourced Logger and Utils from the `core` package.
  - Created Proxy Tree
  - Added `useProxy` Hook to `react` package
  - Updated `core` to work with Proxy KeyMap
