import React from 'react';
import ReactDom from 'react-dom';
import { state, State } from '@pulsejs/core';
import { usePulse } from '@pulsejs/react';

export default function (target: HTMLElement, fieldsCount: number) {
  const FIELDS = state(
    Array.from(Array(fieldsCount).keys()).map((i) => state(`Field #${i + 1}`))
  );

  let updatedFieldsCount = 0;
  let renderFieldsCount = 0;

  function Field({ field }: { field: State<string> }) {
    const name = usePulse(field);

    renderFieldsCount++;

    return (
      <div>
        Last {`<Field>`} render at: {new Date().toISOString()}
        &nbsp;
        <input
          value={name}
          onChange={(e) => {
            field.set(e.target.value);

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
    const fields = usePulse(FIELDS);
    return (
      <div>
        <div>
          Last {`<App>`} render at: {new Date().toISOString()}
        </div>
        <br />
        {fields.map((field, index) => (
          <Field key={index} field={field} />
        ))}
        <div id={'updatedFieldsCount'} />
        <div id={'renderFieldsCount'} />
      </div>
    );
  }

  ReactDom.render(<App key={'agilets-nested-state'} />, target);
}
