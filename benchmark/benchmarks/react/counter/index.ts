import ReactDOM from 'react-dom';
import Benchmark, { Suite, Options } from 'benchmark';

// Files to run the Benchmark on
import agilets from './bench/agilets';
import hookstate from './bench/hookstate';
import jotai from './bench/jotai';
import mobx from './bench/mobx';
import nanostores from './bench/nanostores';
import pulsejs from './bench/pulsejs';
import recoil from './bench/recoil';
import redux from './bench/redux';
import reduxToolkit from './bench/redux-toolkit';
import valtio from './bench/valtio';
import zustand from './bench/zustand';
import {
  cycleLog,
  CycleResultInterface,
  endBenchmarkLog,
  getCycleResult,
  startBenchmarkLog,
} from '../../../benchmarkManager';

// @ts-ignore
// Benchmark.js requires an instance of itself globally
window.Benchmark = Benchmark;

// Create new Benchmark Test Suite
const suite = new Suite('Count');

// Retrieve the Element to render the Benchmark Test Suite in
const target = document.getElementById('bench')!;

// Increment Element
let increment: HTMLHeadingElement;

// Configures a single Benchmark Test
function configTest(renderElement: (target: HTMLElement) => void): Options {
  return {
    fn() {
      // Execute increment action
      increment.click();
    },
    onStart() {
      // Render React Component in the target Element
      renderElement(target);

      // Retrieve Element to execute the increment action on
      increment = target.querySelector('h1')!;
    },
    onComplete() {
      // Set 'output' in the Benchmark itself to print it later
      (this as any).output = parseInt(target.innerText, 10);

      // Unmount React Component
      ReactDOM.unmountComponentAtNode(target);
      target.innerHTML = '';
    },
  };
}

const results: CycleResultInterface[] = [];

// Add Tests to the Benchmark Test Suite
suite
  .add('AgileTs', configTest(agilets))
  .add('Hookstate', configTest(hookstate))
  .add('Jotai', configTest(jotai))
  .add('Mobx', configTest(mobx))
  .add('Nano Stores', configTest(nanostores))
  .add('PulseJs', configTest(pulsejs))
  .add('Recoil', configTest(recoil))
  .add('Redux', configTest(redux))
  .add('Redux-Toolkit', configTest(reduxToolkit))
  .add('Valtio', configTest(valtio))
  .add('Zustand', configTest(zustand))

  // Add Listener
  .on('start', function (this: any) {
    startBenchmarkLog(this.name);
  })
  .on('cycle', (event: any) => {
    const cycleResult = getCycleResult(event);
    cycleLog(cycleResult, `[Count: ${event.target.output}]`);
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
