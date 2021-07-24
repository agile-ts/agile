import { createState, globalBind } from '@agile-ts/core';

export type StopwatchStateType =
  | 'paused' // Stopwatch is paused
  | 'running' // Stopwatch is running
  | 'initial'; // Stopwatch is reset

// State to keep track of the current time of the Stopwatch
const TIME = createState(
  { ms: 0, s: 0, m: 0, h: 0 },
  { key: 'stopwatch-time' },
).persist();

// State to keep track of the current state of the Stopwatch
const STATE = createState<StopwatchStateType>('initial', {
  key: 'stopwatch-state',
}).persist();

const startStopwatch = () => {
  TIME.interval((value) => {
    const newValue = { ...value };
    if (newValue.m === 60) {
      newValue.h += 1;
      newValue.m = 0;
    }

    if (newValue.s === 60) {
      newValue.m += 1;
      newValue.s = 0;
    }

    if (newValue.ms === 99) {
      newValue.s += 1;
      newValue.ms = 0;
    }

    newValue.ms += 1;

    return newValue;
  }, 1);
  STATE.set('running');
};

const clearStopwatch = () => {
  TIME.clearInterval();
};

const resetStopwatch = () => {
  clearStopwatch();
  TIME.set({ ms: 0, h: 0, m: 0, s: 0 });
  STATE.set('initial');
};

const resumeStopwatch = () => {
  startStopwatch();
};

const pauseStopwatch = () => {
  clearStopwatch();
  STATE.set('paused');
};

// Export bundled the associated methods and variables of the Stopwatch
export const StopwatchCore = {
  TIME,
  STATE,
  start: startStopwatch,
  reset: resetStopwatch,
  resume: resumeStopwatch,
  pause: pauseStopwatch,
  clear: clearStopwatch,
};

// Globally bind bundled Stopwatch functionalities
// for better debugging in the browser console
globalBind('__core__', StopwatchCore);
