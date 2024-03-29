import React from 'react';
import ReactDOM from 'react-dom';

import * as Agile from './state-manager/Agile';
import * as Jotai from './state-manager/Jotai';
import * as NanoStores from './state-manager/NanoStores';
import * as Recoil from './state-manager/Recoil';
import * as ReduxToolkit from './state-manager/ReduxToolkit';
import * as Hookstate from './state-manager/Hookstate';

ReactDOM.render(
  <React.StrictMode>
    <Agile.App />
    <Jotai.App />
    <NanoStores.App />
    <Recoil.App />
    <ReduxToolkit.App />
    <Hookstate.App />
  </React.StrictMode>,
  document.getElementById('root')
);
