import Page from '../components/Page';
import { COUNTER, LAST_UPDATED_TIMESTAMP, LIGHT } from '../src/core';

// SSG = Static Site Generation
export default function SSG() {
  return <Page />;
}

// If you build and start the app, the date returned here will have the same
// value for all requests, as this method gets executed at build time.
export function getStaticProps() {
  const initialCore = {
    light: LIGHT.value,
    counter: COUNTER.value,
    lastUpdatedTimestamp: LAST_UPDATED_TIMESTAMP.value,
  };

  console.log('getStaticProps()', initialCore);

  // Note that in this case we're returning the state directly, without creating
  // the store (core) first (like in /pages/ssr.js), this approach can be better and easier
  return {
    props: {
      initialCore,
    },
  };
}
