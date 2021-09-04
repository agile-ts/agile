import ReactDOM from 'react-dom';
import Benchmark, { Suite, Options } from 'benchmark';
import {
  cycleLog,
  CycleResultInterface,
  endBenchmarkLog,
  getCycleResult,
  startBenchmarkLog,
} from '../../benchmarkManager';

// Files to run the Benchmark on
import agileCollection from './bench/agilets/collection';
import agileState from './bench/agilets/state';
import agileNestedState from './bench/agilets/nestedState';
import pulseCollection from './bench/pulsejs/collection';
import pulseState from './bench/pulsejs/state';
import pulseNestedState from './bench/pulsejs/nestedState';
import hookstate from './bench/hookstate';
import jotai from './bench/jotai';
import mobx from './bench/mobx';
import nanostores from './bench/nanostores';
import recoil from './bench/recoil';
import redux from './bench/redux';
import valtio from './bench/valtio';

// @ts-ignore
// Benchmark.js requires an instance of itself globally
window.Benchmark = Benchmark;

const fieldsCount = 1000;

// Create new Benchmark Test Suite
const suite = new Suite(`${fieldsCount} Fields`);

// Retrieve the Element to render the Benchmark Test Suite in
const target = document.getElementById('bench')!;

// Configures a single Benchmark Test
function configTest(
  renderElement: (target: HTMLElement, fieldsCount: number) => void
): Options {
  return {
    fn() {
      // Retrieve Input field to update
      const fieldToUpdate = Math.floor(Math.random() * fieldsCount);
      const input = target.querySelectorAll('input')[fieldToUpdate];

      // Update retrieved Input value
      const evt = document.createEvent('HTMLEvents');
      evt.initEvent('input', true, true);
      input.value = '' + Math.random();
      (input as any)._valueTracker.setValue(Math.random());
      input.dispatchEvent(evt);
    },
    onStart() {
      // Render React Component in the target Element
      renderElement(target, fieldsCount);
    },
    onComplete() {
      (this as any).updatedFieldsCount = parseInt(
        (document.getElementById('updatedFieldsCount') as any)?.innerText,
        10
      );
      (this as any).renderFieldsCount = parseInt(
        (document.getElementById('renderFieldsCount') as any)?.innerText,
        10
      );

      // Unmount React Component
      ReactDOM.unmountComponentAtNode(target);
      target.innerHTML = '';
    },
  };
}

const results: CycleResultInterface[] = [];

// Add Tests to the Benchmark Test Suite
suite
  .add('Agile Collection', configTest(agileCollection))
  .add('Agile State', configTest(agileState))
  .add('Agile nested State', configTest(agileNestedState))
  // .add('Pulse Collection', configTest(pulseCollection))
  // .add('Pulse State', configTest(pulseState))
  // .add('Pulse nested State', configTest(pulseNestedState))
  // .add('Hookstate', configTest(hookstate))
  // .add('Jotai', configTest(jotai))
  // .add('Mobx', configTest(mobx))
  // .add('Nano Stores', configTest(nanostores))
  // .add('Recoil', configTest(recoil))
  // .add('Redux', configTest(redux))
  // .add('Valtio', configTest(valtio))

  // Add Listener
  .on('start', function (this: any) {
    startBenchmarkLog(this.name);
  })
  .on('cycle', (event: any) => {
    const cycleResult = getCycleResult(event);
    cycleLog(
      cycleResult,
      `[updatedFieldsCount: ${event.target.updatedFieldsCount}, renderFieldsCount: ${event.target.renderFieldsCount}]`
    );
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
