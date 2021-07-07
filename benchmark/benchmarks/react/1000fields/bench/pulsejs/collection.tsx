import React from 'react';
import ReactDom from 'react-dom';
import { collection, usePulse } from '@pulsejs/react';

export default function (target: HTMLElement, fieldsCount: number) {
  const FIELDS = collection<{ id: number; name: string }>();
  FIELDS.collect(
    Array.from(Array(fieldsCount).keys()).map((i) => ({
      id: i,
      name: `Field #${i + 1}`,
    }))
  );

  let updatedFieldsCount = 0;
  let renderFieldsCount = 0;

  function Field({ index }: { index: number | string }) {
    const ITEM = FIELDS.getData(index);
    const item = usePulse(ITEM);

    renderFieldsCount++;

    return (
      <div>
        Last {`<Field>`} render at: {new Date().toISOString()}
        &nbsp;
        <input
          value={item?.name}
          onChange={(e) => {
            ITEM?.patch({ name: e.target.value });

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
        {Object.keys(FIELDS.data).map((key, i) => (
          <Field key={i} index={key} />
        ))}
        <div id={'updatedFieldsCount'} />
        <div id={'renderFieldsCount'} />
      </div>
    );
  }

  ReactDom.render(<App key={'agilets-collection'} />, target);
}
