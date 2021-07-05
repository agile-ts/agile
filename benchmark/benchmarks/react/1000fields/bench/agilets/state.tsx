import React from 'react';
import ReactDom from 'react-dom';
import { Agile, Logger } from '@agile-ts/core';
import { useProxy, useSelector } from '@agile-ts/react';

export default function (target: HTMLElement, fieldsCount: number) {
  const AgileApp = new Agile({ logConfig: { level: Logger.level.ERROR } });

  const FIELDS = AgileApp.createState(
    Array.from(Array(fieldsCount).keys()).map((i) => `Field #${i + 1}`)
  );

  let updatedFieldsCount = 0;
  let renderFieldsCount = 0;

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

    renderFieldsCount++;

    return (
      <div>
        Last {`<Field>`} render at: {new Date().toISOString()}
        &nbsp;
        <input
          value={fields[index]}
          onChange={(e) => {
            FIELDS.nextStateValue[index] = e.target.value;
            FIELDS.ingest();

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
        {FIELDS.value.map((field, index) => (
          <Field key={index} index={index} />
        ))}
        <div id={'updatedFieldsCount'} />
        <div id={'renderFieldsCount'} />
      </div>
    );
  }

  ReactDom.render(<App key={'agilets-state'} />, target);
}
