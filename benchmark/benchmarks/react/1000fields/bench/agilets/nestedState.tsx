import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Agile, Logger, State } from '@agile-ts/core';
import { useAgile } from '@agile-ts/react';

const AgileApp = new Agile({ logConfig: { level: Logger.level.ERROR } });

const FIELDS = AgileApp.createState(
  Array.from(Array(1000).keys()).map((i) =>
    AgileApp.createState(`Field #${i + 1}`)
  )
);

let updatedFieldsCount = 0;

function Field({ field }: { field: State<string> }) {
  const name = useAgile(field);

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
  const fields = useAgile(FIELDS);
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
  ReactDom.render(<App key={'agilets-nested-state'} />, target);
}
