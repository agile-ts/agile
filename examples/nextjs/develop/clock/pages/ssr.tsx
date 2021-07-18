import Page from '../components/Page';
import { LIGHT, COUNTER, LAST_UPDATED_TIMESTAMP, tick } from '../src/core';

// Server Side Rendering
export default function SSR() {
  return <Page />;
}

// The date returned here will be different for every request that hits the page,
// that is because the page becomes a serverless function instead of being statically
// exported when you use `getServerSideProps` or `getInitialProps`
export function getServerSideProps() {
  tick(Date.now(), false);

  const initialCore = {
    light: LIGHT.value,
    counter: COUNTER.value,
    lastUpdatedTimestamp: LAST_UPDATED_TIMESTAMP.value,
  };

  console.log('getServerSideProps()', initialCore);

  return {
    props: {
      initialCore,
    },
  };
}
