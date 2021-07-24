import React from 'react';
import Head from 'next/head';
import Counter from '../components/Counter';

const Home = () => {
  return (
    <div>
      <Head>
        <title>Counter</title>
        <meta name={'keywords'} content={'counter, agilets'} />
      </Head>
      <Counter />
    </div>
  );
};

export default Home;
