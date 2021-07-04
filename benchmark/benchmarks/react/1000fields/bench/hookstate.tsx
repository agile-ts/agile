import * as React from 'react';
import * as ReactDom from 'react-dom';
import { createState, useHookstate, State } from '@hookstate/core';

const fields = createState(
  Array.from(Array.from(Array(1000).keys()).map((i) => `Field #${i + 1} value`))
);

function Field({ field }: { field: State<string> }) {
  const name = useHookstate(field);

  return (
    <div>
      Last {`<Field>`} render at: {new Date().toISOString()}
      &nbsp;
      <input
        value={name.get()}
        onChange={(e) => {
          name.set(e.target.value);
        }}
      />
    </div>
  );
}

function App() {
  const state = useHookstate(fields);
  return (
    <div>
      <div>
        Last {`<App>`} render at: {new Date().toISOString()}
      </div>
      <br />
      {state.map((field, index) => (
        <Field key={index} field={field} />
      ))}
    </div>
  );
}

export default function (target: HTMLElement) {
  ReactDom.render(<App key={'hookstate'} />, target);
}
