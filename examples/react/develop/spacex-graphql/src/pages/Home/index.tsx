import React from 'react';
import { fetchLaunches } from '../../core';
import { fetchLaunchesWithApollo } from '../../core/apolloTest';

import styles from './Home.module.css';

const Home: React.FC = () => {
  React.useEffect(() => {
    fetchLaunches();
    fetchLaunchesWithApollo();
  }, []);
  return (
    <div className={styles.container}>
      {/* Header */}
      <h1 className={styles.title}>SpaceX Launches</h1>
      <h3 className={styles.subtitle}>Latest launches from SpaceX</h3>

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
};

export default Home;
