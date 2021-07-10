import React from 'react';
import ReactDom from 'react-dom';
import { createState, useHookstate, State } from '@hookstate/core';

export default function (target: HTMLElement, fieldsCount: number) {
  const fields = createState(
    Array.from(
      Array.from(Array(fieldsCount).keys()).map((i) => `Field #${i + 1} value`)
    )
  );

  let updatedFieldsCount = 0;
  let renderFieldsCount = 0;

  function Field({ field }: { field: State<string> }) {
    const name = useHookstate(field);

    renderFieldsCount++;

    return (
      <div>
        Last {`<Field>`} render at: {new Date().toISOString()}
        &nbsp;
        <input
          value={name.get()}
          onChange={(e) => {
            name.set(e.target.value);

            updatedFieldsCount++;

            (document.getElementById(
              'updatedFieldsCount'
            ) as any).innerText = updatedFieldsCount;
            (document.getElementById(
              'renderFieldsCount'
            ) as any).innerText = renderFieldsCount;
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
        <div id={'updatedFieldsCount'} />
        <div id={'renderFieldsCount'} />
      </div>
    );
  }

  ReactDom.render(<App key={'hookstate'} />, target);
}
