import * as React from 'react';
import * as ReactDom from 'react-dom';
import { atom, useAtom, Atom } from 'jotai';

const fields = Array.from(Array(1000).keys()).map((i) =>
  atom(`Field #${i + 1}`)
);

const fieldsStore = atom(fields);

function Field({ field }: { field: Atom<string> }) {
  const [name, rename] = useAtom(field);

  return (
    <div>
      Last {`<Field>`} render at: {new Date().toISOString()}
      &nbsp;
      <input value={name} onChange={(e) => rename(e.target.value)} />
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
    </div>
  );
}

export default function (target: HTMLElement) {
  ReactDom.render(<App key={'jotai'} />, target);
}
