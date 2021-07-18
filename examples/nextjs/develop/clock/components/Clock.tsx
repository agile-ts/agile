import { useAgile } from '@agile-ts/react';
import { LAST_UPDATED_TIMESTAMP, LIGHT } from '../src/core';

const formatTime = (timestamp: number) => {
  // cut off except hh:mm:ss
  return new Date(timestamp).toJSON().slice(11, 19);
};

const Clock = () => {
  const [lastUpdatedTimestamp, light] = useAgile([
    LAST_UPDATED_TIMESTAMP,
    LIGHT,
  ]);

  return (
    <div className={light ? 'light' : ''}>
      {formatTime(lastUpdatedTimestamp)}
      <style jsx>{`
        div {
          padding: 15px;
          display: inline-block;
          color: #82fa58;
          font: 50px menlo, monaco, monospace;
          background-color: #000;
        }
        .light {
          background-color: #999;
        }
      `}</style>
    </div>
  );
};

export default Clock;
