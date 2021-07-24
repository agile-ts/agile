import React, { useEffect } from 'react';
import type { AppProps } from 'next/app';
import { initializeCore } from '../src/core';

const App: React.FC<AppProps> = (props) => {
  const { Component, pageProps } = props;

  useEffect(() => {
    initializeCore(pageProps.initialCore as any);
  }, []);

  return <Component {...pageProps} />;
};
export default App;
