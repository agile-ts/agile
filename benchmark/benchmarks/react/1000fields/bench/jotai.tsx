import * as React from 'react';
import * as ReactDom from 'react-dom';
import { atom, useAtom, Atom } from 'jotai';

const fields = Array.from(Array(1000).keys()).map((i) =>
  atom(`Field #${i + 1}`)
);

const fieldsStore = atom(fields);

let updatedFieldsCount = 0;

function Field({ field }: { field: Atom<string> }) {
  const [name, rename] = useAtom(field);

  updatedFieldsCount++;

  return (
    <div>
      Last {`<Field>`} render at: {new Date().toISOString()}
      &nbsp;
      <input
        value={name}
        onChange={(e) => {
          rename(e.target.value);
          (document.getElementById(
            'updatedFieldsCount'
          ) as any).innerText = updatedFieldsCount;
        }}
      />
    </div>
  );
}

function App() {
  const [fields] = useAtom(fieldsStore);

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
  ReactDom.render(<App key={'jotai'} />, target);
}
