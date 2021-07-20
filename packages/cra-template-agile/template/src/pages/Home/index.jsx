import React from 'react';
import Stopwatch from '../../components/Stopwatch';

import styles from './Home.module.css';

function Home() {
  return (
    <div className={styles.container}>
      {/* Header */}
      <h1 className={styles.title}>
        Welcome to <a href="https://agile-ts.org">AgileTs!</a>
      </h1>
      <h3 className={styles.subtitle}>
        in a <a href="https://reactjs.org">React</a> application
      </h3>

      <div className={styles.divider} />

      {/* Stopwatch */}
      <p className={styles.getStartedText}>
        Get started by editing{' '}
        <code className={styles.code}>core/index.js</code>
      </p>
      <Stopwatch />

      {/* Cards */}
      <div className={styles.cardsContainer}>
        <a
          href="https://agile-ts.org/docs/introduction/"
          className={styles.card}
        >
          <h2>Documentation &rarr;</h2>
          <p>Find in-depth information about AgileTs features and API.</p>
        </a>

        <a
          href="https://github.com/agile-ts/agile/discussions"
          className={styles.card}
        >
          <h2>Help &rarr;</h2>
          <p>Ask your questions and get help by the community.</p>
        </a>
      </div>
    </div>
  );
}

export default Home;
