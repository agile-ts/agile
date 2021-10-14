import React from 'react';
import ReactDom from 'react-dom';
import { createState, logCodeManager, shared } from '@agile-ts/core';
import reactIntegration, { useAgile } from '@agile-ts/react';

logCodeManager.allowLogging = false;
shared.integrate(reactIntegration);

export default function (target: HTMLElement, fieldsCount: number) {
  const FIELDS = createState(
    Array.from(Array(fieldsCount).keys()).map((i) => `Field #${i + 1}`)
  );

  let updatedFieldsCount = 0;
  let renderFieldsCount = 0;

  function Field({ index }: { index: number }) {
    const fields = useAgile(FIELDS);

    renderFieldsCount++;

    return (
      <div>
        Last {`<Field>`} render at: {new Date().toISOString()}
        &nbsp;
        <input
          value={fields[index]}
          onChange={(e) => {
            FIELDS.nextStateValue[index] = e.target.value;
            FIELDS.ingest();

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
    return (
      <div>
        <div>
          Last {`<App>`} render at: {new Date().toISOString()}
        </div>
        <br />
        {FIELDS.value.map((field, index) => (
          <Field key={index} index={index} />
        ))}
        <div id={'updatedFieldsCount'} />
        <div id={'renderFieldsCount'} />
      </div>
    );
  }

  ReactDom.render(<App key={'agilets-state'} />, target);
}
