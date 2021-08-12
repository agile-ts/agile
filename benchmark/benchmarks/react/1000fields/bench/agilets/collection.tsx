import React from 'react';
import ReactDom from 'react-dom';
import { createCollection, shared } from '@agile-ts/core';
import reactIntegration, { useAgile, useValue } from '@agile-ts/react';
import { assignSharedAgileLoggerConfig } from '@agile-ts/logger';

assignSharedAgileLoggerConfig({ active: false });
shared.integrate(reactIntegration);

export default function (target: HTMLElement, fieldsCount: number) {
  const FIELDS = createCollection({
    initialData: Array.from(Array(fieldsCount).keys()).map((i) => ({
      id: i,
      name: `Field #${i + 1}`,
    })),
  });

  let updatedFieldsCount = 0;
  let renderFieldsCount = 0;

  function Field({ index }: { index: number | string }) {
    const ITEM = FIELDS.getItem(index);
    const item = useAgile(ITEM);

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
    const fieldKeys = useValue(FIELDS);

    return (
      <div>
        <div>
          Last {`<App>`} render at: {new Date().toISOString()}
        </div>
        <br />
        {fieldKeys.map((key, i) => (
          <Field key={i} index={key} />
        ))}
        <div id={'updatedFieldsCount'} />
        <div id={'renderFieldsCount'} />
      </div>
    );
  }

  ReactDom.render(<App key={'agilets-collection'} />, target);
}
