import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Agile, Logger } from '@agile-ts/core';
import { useProxy, useSelector } from '@agile-ts/react';

const AgileApp = new Agile({ logConfig: { level: Logger.level.ERROR } });

const FIELDS = AgileApp.createState(
  Array.from(Array(1000).keys()).map((i) => `Field #${i + 1}`)
);

// With Selector
// function Field({ index }: { index: number }) {
//   const name = useSelector(FIELDS, (value) => value[index]) as string;
//
//   return (
//     <div>
//       Last {`<Field>`} render at: {new Date().toISOString()}
//       &nbsp;
//       <input value={name} onChange={(e) => {
//         FIELDS.nextStateValue[index] = e.target.value;
//         FIELDS.ingest();
//       }} />
//     </div>
//   );
// }

// With Proxy
function Field({ index }: { index: number }) {
  const fields = useProxy(FIELDS);

  return (
    <div>
      Last {`<Field>`} render at: {new Date().toISOString()}
      &nbsp;
      <input
        value={fields[index]}
        onChange={(e) => {
          FIELDS.nextStateValue[index] = e.target.value;
          FIELDS.ingest();
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
      {FIELDS.value.map((field, index) => (
        <Field key={index} index={index} />
      ))}
    </div>
  );
}

export default function (target: HTMLElement) {
  ReactDom.render(<App key={'agilets-state'} />, target);
}
