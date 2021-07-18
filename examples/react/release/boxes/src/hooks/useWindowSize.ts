import { useEffect, useState } from 'react';

export interface WindowSizeInterface {
  windowWidth: number;
  windowHeight: number;
  scrollHeight: number;
}

export function useWindowSize(): WindowSizeInterface {
  // Initialize state with undefined width/height so server and client renders match
  // Learn more here: https://joshwcomeau.com/react/the-perils-of-rehydration/
  const [windowSize, setWindowSize] = useState<WindowSizeInterface>({
    windowWidth: undefined as any,
    windowHeight: undefined as any,
    scrollHeight: undefined as any,
  });

  useEffect(() => {
    function handleResize() {
      setWindowSize({
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight,
        scrollHeight: document.documentElement.scrollHeight,
      });
    }

    // Add event listener
    window.addEventListener('resize', handleResize);

    // Call handler right away so state gets updated with initial window size
    handleResize();

    // Remove event listener on cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowSize;
}
