import React from 'react';
import ReactDom from 'react-dom';
import { atom, RecoilRoot, RecoilState, useRecoilState } from 'recoil';

const fields = Array.from(Array(1000).keys()).map((i) =>
  atom({ key: `field-${i}`, default: `Field #${i + 1}` })
);

const fieldsStore = atom({
  key: 'fieldsStore',
  default: fields,
});

function Field({ field }: { field: RecoilState<string> }) {
  const [name, rename] = useRecoilState(field);

  return (
    <div>
      Last {`<Field>`} render at: {new Date().toISOString()}
      &nbsp;
      <input value={name} onChange={(e) => rename(e.target.value)} />
    </div>
  );
}

function App() {
  const [fields] = useRecoilState(fieldsStore);

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
  ReactDom.render(
    <RecoilRoot>
      <App key={'recoil'} />
    </RecoilRoot>,
    target
  );
}
