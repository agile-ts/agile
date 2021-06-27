import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';

import Canvas from './screens/Canvas';

function App() {
  return (
    <Router>
      <Switch>
        <Route>
          <Canvas />
        </Route>
      </Switch>
    </Router>
  );
}

export default App;
