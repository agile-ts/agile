import React from 'react';
import { useAgile } from '@agile-ts/react';
import { StopwatchCore } from '../../core';
import Button from './components/Button';

import styles from './Stopwatch.module.css';

const Stopwatch: React.FC = () => {
  const [time, state] = useAgile([StopwatchCore.TIME, StopwatchCore.STATE]);

  // Restart Stopwatch when the persisted value has been loaded
  // and clear the counter interval when the Component unmounts
  React.useEffect(() => {
    StopwatchCore.STATE.onLoad(() => {
      if (StopwatchCore.STATE.value === 'running') StopwatchCore.start();
    });

    return () => {
      StopwatchCore.clear();
    };
  }, []);

  return (
    <div className={styles.container}>
      {/* Display */}
      <div className={styles.displayContainer}>
        <span>{time.h >= 10 ? time.h : `0${time.h}`}</span>&nbsp;:&nbsp;
        <span>{time.m >= 10 ? time.m : `0${time.m}`}</span>&nbsp;:&nbsp;
        <span>{time.s >= 10 ? time.s : `0${time.s}`}</span>
      </div>

      {/* Buttons */}
      <div className={styles.buttonContainer}>
        {state === 'initial' && (
          <Button onClick={StopwatchCore.start} color="#8481af">
            Start
          </Button>
        )}
        {state === 'paused' && (
          <Button onClick={StopwatchCore.resume} color="#00ccb1">
            Resume
          </Button>
        )}
        {state === 'running' && (
          <Button onClick={StopwatchCore.pause} color="#c4b325">
            Pause
          </Button>
        )}
        {(state === 'paused' || state === 'running') && (
          <Button onClick={StopwatchCore.reset} color="#fd7b7b">
            Reset
          </Button>
        )}
      </div>
    </div>
  );
};

export default Stopwatch;
