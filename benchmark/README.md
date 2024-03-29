# 🚀️ Benchmarks

The `Benchmark Test Suites` are supposed to showcase where AgileTs is roughly located in terms of performance.
I know a counter doesn't really show real world app performance, 
but it is better than nothing.

### What do the results from benchmark js mean?
https://stackoverflow.com/questions/28524653/what-do-the-results-from-benchmark-js-mean

## Counter Benchmark

```ts
1. AgileTs.............43028 ops/se ±2.45 (63 runs sampled)
2. PulseJs.............41086 ops/se ±2.60 (63 runs sampled)
3. Nano Stores.........31933 ops/se ±1.27 (63 runs sampled)
4. Zustand.............29329 ops/se ±1.30 (62 runs sampled)
5. Redux...............28845 ops/se ±2.47 (61 runs sampled)
6. Hookstate...........27555 ops/se ±5.00 (59 runs sampled)
7. Mobx................27427 ops/se ±3.69 (62 runs sampled)
8. Redux-Toolkit.......22191 ops/se ±1.06 (65 runs sampled)
9. Jotai...............22157 ops/se ±4.10 (63 runs sampled)
10. Valtio..............21089 ops/se ±0.77 (63 runs sampled)
11. Recoil..............13926 ops/se ±2.12 (62 runs sampled)

Fastest is AgileTs
```

## 1000 Fields

```ts
// 1 Field
1. Agile nested State..27992 ops/se ±1.73 (64 runs sampled)
2. Pulse Collection....25547 ops/se ±1.04 (64 runs sampled)
3. Agile State.........23962 ops/se ±2.16 (64 runs sampled)
4. Nano Stores.........20662 ops/se ±1.76 (65 runs sampled)
5. Hookstate...........19430 ops/se ±1.81 (61 runs sampled)
6. Agile Collection....18491 ops/se ±2.13 (65 runs sampled)
7. Jotai...............16029 ops/se ±3.39 (62 runs sampled)
8. Mobx................15631 ops/se ±3.42 (61 runs sampled)
9. Redux...............12698 ops/se ±2.86 (61 runs sampled)
10. Recoil..............11183 ops/se ±3.73 (61 runs sampled)
11. Valtio..............9728 ops/se ±2.81 (62 runs sampled)

Fastest is Agile nested State

// 10 Fields
1. Agile nested State..27658 ops/se ±1.99 (64 runs sampled)
2. Pulse Collection....24839 ops/se ±1.31 (65 runs sampled)
3. Agile State.........19853 ops/se ±2.15 (64 runs sampled)
4. Nano Stores.........19479 ops/se ±2.12 (60 runs sampled)
5. Hookstate...........18104 ops/se ±3.37 (60 runs sampled)
6. Jotai...............15472 ops/se ±2.45 (62 runs sampled)
7. Agile Collection....13352 ops/se ±3.67 (61 runs sampled)
8. Recoil..............10522 ops/se ±3.79 (58 runs sampled)
9. Mobx................9477 ops/se ±1.94 (62 runs sampled)
10. Redux...............8434 ops/se ±2.67 (47 runs sampled)
11. Valtio..............3532 ops/se ±2.27 (23 runs sampled)

Fastest is Agile nested State

// 100 Fields
1. Agile nested State..24124 ops/se ±1.05 (65 runs sampled)
2. Pulse Collection....21912 ops/se ±1.35 (66 runs sampled)
3. Nano Stores.........15638 ops/se ±1.63 (62 runs sampled)
4. Hookstate...........13986 ops/se ±2.28 (59 runs sampled)
5. Jotai...............12167 ops/se ±2.78 (63 runs sampled)
6. Agile State.........9175 ops/se ±1.56 (51 runs sampled)
7. Recoil..............8717 ops/se ±3.51 (49 runs sampled)
8. Agile Collection....4177 ops/se ±1.64 (61 runs sampled)
9. Redux...............1763 ops/se ±1.06 (63 runs sampled)
10. Mobx................1699 ops/se ±1.82 (62 runs sampled)
11. Valtio..............432 ops/se ±2.18 (60 runs sampled)

Fastest is Agile nested State

// 1000 Fields
1. Agile nested State..10756 ops/se ±1.43 (58 runs sampled)
2. Pulse Collection....9774 ops/se ±2.39 (58 runs sampled)
3. Hookstate...........4737 ops/se ±4.33 (58 runs sampled)
4. Nano Stores.........4638 ops/se ±6.40 (28 runs sampled)
5. Jotai...............3352 ops/se ±4.17 (53 runs sampled)
6. Recoil..............3139 ops/se ±4.69 (54 runs sampled)
7. Agile State.........1389 ops/se ±1.52 (57 runs sampled)
8. Agile Collection....500 ops/se ±1.89 (61 runs sampled)
9. Redux...............154 ops/se ±1.48 (57 runs sampled)
10. Mobx................144 ops/se ±1.06 (55 runs sampled)
11. Valtio..............37 ops/se ±4.26 (40 runs sampled)

Fastest is Agile nested State
```

## Computed

```ts
1. Agile Hard Coded....32079 ops/se ±1.51 (62 runs sampled)
2. Agile Auto Tracking.30974 ops/se ±2.21 (64 runs sampled)
3. Nano Stores.........28821 ops/se ±1.49 (64 runs sampled)
4. Jotai...............18922 ops/se ±2.12 (61 runs sampled)
5. Recoil..............10103 ops/se ±2.47 (64 runs sampled)

Fastest is Agile Hard Coded
```

## 🏃 Running Benchmarks

The Benchmark tests run on top of the [`benchmark.js` library](https://github.com/bestiejs/benchmark.js/)
via [Playwright](https://github.com/microsoft/playwright) in the Chrome Browser.

Before starting, make sure you are in the `/benchmark` directory.

### 1️⃣ Install dependencies

To prepare the dependencies, run:
```ts
yarn install
```

### 2️⃣ Run Benchmark Test Suite

Execute the benchmark located in `./benchmarks/react/counter`.
```ts
yarn run test:counter
```
If you want to test it manually, enable the `dev mode`.
```ts
yarn run test:counter --dev
```
The difference to the 'normal' mode is that:
- the executed bundle isn't `minified`
- the test has to be started manually by opening `localhost:3003`
- the test results are printed in the `browser console`

## ⭐️ Contribute

Feel free to add more tests and State Managers to be tested. We welcome any meaningful contribution. 😀
To find out more about contributing, check out the [CONTRIBUTING.md](https://github.com/agile-ts/agile/blob/master/CONTRIBUTING.md).

<a href="https://codeclimate.com/github/agile-ts/agile/coverage.svg">
   <img src="https://codeclimate.com/github/agile-ts/agile/badges/gpa.svg" alt="Maintainability"/>
</a>

## 🎉 Credits

The Benchmark CLI is inspired by [`exome`](https://github.com/Marcisbee/exome).
