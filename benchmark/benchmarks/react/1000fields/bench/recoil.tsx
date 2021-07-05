import React from 'react';
import ReactDom from 'react-dom';
import { atom, RecoilRoot, RecoilState, useRecoilState } from 'recoil';

export default function (target: HTMLElement, fieldsCount: number) {
  const fields = Array.from(Array(fieldsCount).keys()).map((i) =>
    atom({ key: `field-${i}`, default: `Field #${i + 1}` })
  );

  const fieldsStore = atom({
    key: 'fieldsStore',
    default: fields,
  });

  let updatedFieldsCount = 0;
  let renderFieldsCount = 0;

  function Field({ field }: { field: RecoilState<string> }) {
    const [name, rename] = useRecoilState(field);

    renderFieldsCount++;

    return (
      <div>
        Last {`<Field>`} render at: {new Date().toISOString()}
        &nbsp;
        <input
          value={name}
          onChange={(e) => {
            rename(e.target.value);

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
        <div id={'updatedFieldsCount'} />
        <div id={'renderFieldsCount'} />
      </div>
    );
  }

  ReactDom.render(
    <RecoilRoot>
      <App key={'recoil'} />
    </RecoilRoot>,
    target
  );
}
