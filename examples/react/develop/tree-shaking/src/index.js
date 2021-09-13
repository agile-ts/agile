import { BarComponent } from './App';
import { MY_STATE } from './core';

MY_STATE.set('jeff');

// we could do something with BarComponent here,
// like ReactDOM.render, but let's just dump it to
// console for simplicity
console.log(BarComponent);
