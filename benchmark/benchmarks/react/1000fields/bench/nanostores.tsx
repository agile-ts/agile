import React from 'react';
import ReactDom from 'react-dom';
import { createStore, WritableStore } from 'nanostores';
import { useStore } from 'nanostores/react';

const fieldsStore = createStore<WritableStore<string>[]>(() => {
  const fields = Array.from(Array(1000).keys()).map((i) => {
    const fieldStore = createStore<string>(() => {
      fieldsStore.set(`Field #${i + 1}` as any);
    });
    return fieldStore;
  });

  fieldsStore.set(fields);
});

let updatedFieldsCount = 0;

function Field({ field }: { field: WritableStore<string> }) {
  const name = useStore(field);

  updatedFieldsCount++;

  return (
    <div>
      Last {`<Field>`} render at: {new Date().toISOString()}
      &nbsp;
      <input
        value={name}
        onChange={(e) => {
          field.set(e.target.value);
          (document.getElementById(
            'updatedFieldsCount'
          ) as any).innerText = updatedFieldsCount;
        }}
      />
    </div>
  );
}

function App() {
  const fields = useStore(fieldsStore);
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
    </div>
  );
}

export default function (target: HTMLElement) {
  ReactDom.render(<App key={'nanostores'} />, target);
}
