import Benchmark, { Suite } from 'benchmark';
import {
  cycleLog,
  CycleResultInterface,
  endBenchmarkLog,
  getCycleResult,
  startBenchmarkLog,
} from '../../benchmarkManager';

// Files to run the Benchmark on
import * as lodash from './bench/lodash';
import * as looper from './bench/looper';
import * as stringify from './bench/stringify';

const toClone = { x1: true, x2: undefined };

// @ts-ignore
// Benchmark.js requires an instance of itself globally
window.Benchmark = Benchmark;

// Create new Benchmark Test Suite
const suite = new Suite('clone deep');

const results: CycleResultInterface[] = [];

// Add Tests to the Benchmark Test Suite
suite
  .add('Lodash', function () {
    lodash.cloneDeep(toClone);
  })
  .add('Looper', function () {
    looper.cloneDeep(toClone);
  })
  .add('Stringify', function () {
    stringify.cloneDeep(toClone);
  })

  // Add Listener
  .on('start', function (this: any) {
    startBenchmarkLog(this.name);
  })
  .on('cycle', (event: any) => {
    const cycleResult = getCycleResult(event);
    cycleLog(cycleResult);
    results.push(cycleResult);
  })
  .on('complete', function (this: any) {
    endBenchmarkLog(this.name, results, this.filter('fastest').map('name'));

    // @ts-ignore
    // Notify server that the Benchmark Test Suite has ended
    window.TEST.ended = true;
  })

  // Run Benchmark Test Suite
  .run({ async: true });
