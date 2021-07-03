import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Agile, Logger } from '@agile-ts/core';
import { useAgile } from '@agile-ts/react';

const AgileApp = new Agile({ logConfig: { level: Logger.level.ERROR } });

const FIELDS = AgileApp.createState(
  Array.from(Array(1000).keys()).map((i) =>
    AgileApp.createState(`Field #${i + 1}`)
  )
);

function Field({ index }: { index: number }) {
  const name = useAgile(FIELDS.value[index]);

  return (
    <div>
      Last {`<Field>`} render at: {new Date().toISOString()}
      &nbsp;
      <input
        value={name}
        onChange={(e) => {
          FIELDS.value[index].set(e.target.value);
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
        <Field key={index} index={index} />
      ))}
    </div>
  );
}

export default function (target: HTMLElement) {
  ReactDom.render(<App key={'agilets-nested-state'} />, target);
}
