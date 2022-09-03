import React from 'react';
import { createCollection, LogCodeManager, shared } from '@agile-ts/core';
import reactIntegration, { useAgile, useValue } from '@agile-ts/react';

LogCodeManager.setAllowLogging(false);
shared.integrate(reactIntegration);

const FIELDS = createCollection({
  initialData: Array.from(Array(5000).keys()).map((i) => ({
    id: i,
    name: `Field #${i + 1}`,
  })),
});

let renderFieldsCount = 0;

function Field({ index }) {
  const ITEM = FIELDS.getItem(index);
  const item = useAgile(ITEM);

  console.log(`Rerender Fields at '${index}':`, ++renderFieldsCount);

  return (
    <div>
      Last {`<Field>`} render at: {new Date().toISOString()}
      &nbsp;
      <input
        value={item?.name}
        onChange={(e) => {
          ITEM?.patch({ name: e.target.value });
        }}
      />
    </div>
  );
}

export default function App() {
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
      <button
        onClick={() => {
          FIELDS.collect({
            id: FIELDS.size,
            name: `Field #${FIELDS.size + 1}`,
          });
        }}
      >
        Add Field
      </button>
    </div>
  );
}
