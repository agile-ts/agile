import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Agile, Logger } from '@agile-ts/core';
import { useAgile, useValue } from '@agile-ts/react';

const AgileApp = new Agile({ logConfig: { level: Logger.level.ERROR } });

const FIELDS = AgileApp.createCollection({
  initialData: Array.from(Array(1000).keys()).map((i) => ({
    id: i,
    name: `Field #${i + 1}`,
  })),
});

function Field({ index }: { index: number | string }) {
  const ITEM = FIELDS.getItem(index);
  const item = useAgile(ITEM);

  return (
    <div>
      Last {`<Field>`} render at: {new Date().toISOString()}
      &nbsp;
      <input
        value={item?.name}
        onChange={(e) => ITEM?.patch({ name: e.target.value })}
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
    </div>
  );
}

export default function (target: HTMLElement) {
  ReactDom.render(<App key={'agilets-collection'} />, target);
}
