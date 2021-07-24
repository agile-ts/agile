import React from 'react';
import Stopwatch from '../../components/Stopwatch';

import styles from './Home.module.css';

const Home: React.FC = () => (
  <div className={styles.container}>
    <Stopwatch />
  </div>
);

export default Home;
