import React from 'react';
import type { AppProps } from 'next/app';

import '../styles/globals.css';

const App: React.FC<AppProps> = (props) => {
  const { Component, pageProps } = props;
  return <Component {...pageProps} />;
};
export default App;
