import React from 'react';
import ReactDom from 'react-dom';
import { proxy, useSnapshot } from 'valtio';

export default function (target: HTMLElement, fieldsCount: number) {
  const state = proxy({
    fields: Array.from(Array(fieldsCount).keys()).map((i) => `Field #${i + 1}`),
  });

  let updatedFieldsCount = 0;
  let renderFieldsCount = 0;

  function Field({ index }: { index: number }) {
    const { fields } = useSnapshot(state);
    const name = fields[index];

    renderFieldsCount++;

    return (
      <div>
        Last {`<Field>`} render at: {new Date().toISOString()}
        &nbsp;
        <input
          value={name}
          onChange={(e) => {
            state.fields[index] = e.target.value;

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
    const { fields } = useSnapshot(state, { sync: true });

    return (
      <div>
        <div>
          Last {`<App>`} render at: {new Date().toISOString()}
        </div>
        <br />
        {fields.map((field, index) => (
          <Field key={index} index={index} />
        ))}
        <div id={'updatedFieldsCount'} />
        <div id={'renderFieldsCount'} />
      </div>
    );
  }

  ReactDom.render(<App key={'valtio'} />, target);
}
