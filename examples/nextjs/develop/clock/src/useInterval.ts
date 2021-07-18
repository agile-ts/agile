import { useEffect, useRef } from 'react';

// https://overreacted.io/making-setinterval-declarative-with-react-hooks/
const useInterval = (callback, delay) => {
  const activeCallback = useRef();

  useEffect(() => {
    activeCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    // @ts-ignore
    const handler = (...args) => activeCallback.current(...args);

    if (delay !== null) {
      const id = setInterval(handler, delay);
      return () => clearInterval(id);
    }
  }, [delay]);
};

export default useInterval;
