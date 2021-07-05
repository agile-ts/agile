import React from 'react';
import ReactDom from 'react-dom';
import { action, observable } from 'mobx';
import { observer } from 'mobx-react';

export default function (target: HTMLElement, fieldsCount: number) {
  const appState = observable({
    fields: Array.from(Array(fieldsCount).keys()).map((i) => `Field #${i + 1}`),
    rename: action(function (value: string, index: number) {
      // console.log(state)
      appState.fields[index] = value;
    }),
  });

  let updatedFieldsCount = 0;
  let renderFieldsCount = 0;

  function Field({ index }: { index: number }) {
    const field = appState.fields[index];

    renderFieldsCount++;

    return (
      <div>
        Last {`<Field>`} render at: {new Date().toISOString()}
        &nbsp;
        <input
          value={field}
          onChange={(e) => {
            appState.rename(e.target.value, index);

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

  const App = observer(() => {
    return (
      <div>
        <div>
          Last {`<App>`} render at: {new Date().toISOString()}
        </div>
        <br />
        {appState.fields.map((field, index) => (
          <Field key={index} index={index} />
        ))}
        <div id={'updatedFieldsCount'} />
        <div id={'renderFieldsCount'} />
      </div>
    );
  });

  ReactDom.render(<App key={'mobx'} />, target);
}
