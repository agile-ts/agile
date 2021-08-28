import { Agile, globalBind } from '@agile-ts/core';

const App = new Agile();

export default App;

// Create global Instance of SignUpEditor (for better debugging)
globalBind('__signUpEditor__', require('./signUpEditor'));
