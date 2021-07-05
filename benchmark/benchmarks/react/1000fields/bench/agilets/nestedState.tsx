import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Agile, Logger, State } from '@agile-ts/core';
import { useAgile } from '@agile-ts/react';

export default function (target: HTMLElement, fieldsCount: number) {
  const AgileApp = new Agile({
    logConfig: { level: Logger.level.ERROR },
  });

  const FIELDS = AgileApp.createState(
    Array.from(Array(fieldsCount).keys()).map((i) =>
      AgileApp.createState(`Field #${i + 1}`)
    )
  );

  let updatedFieldsCount = 0;
  let renderFieldsCount = 0;

  function Field({ field }: { field: State<string> }) {
    const name = useAgile(field);

    renderFieldsCount++;

    return (
      <div>
        Last {`<Field>`} render at: {new Date().toISOString()}
        &nbsp;
        <input
          value={name}
          onChange={(e) => {
            field.set(e.target.value);

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
        <div id={'renderFieldsCount'} />
      </div>
    );
  }

  ReactDom.render(<App key={'agilets-nested-state'} />, target);
}
