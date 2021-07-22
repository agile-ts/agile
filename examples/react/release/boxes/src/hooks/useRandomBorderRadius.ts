import { useEffect, useState } from 'react';

export const useRandomBorderRadius = () => {
  const [randomBorder, setRandomBorder] = useState<string>('');

  useEffect(() => {
    const random = (start: number, end: number) => {
      return Math.floor(Math.random() * end) + start;
    };

    setRandomBorder(
      `${random(10, 50)}px ${random(10, 50)}px ${random(10, 50)}px ${random(
        10,
        50
      )}px/${random(10, 50)}px ${random(10, 50)}px ${random(10, 50)}px ${random(
        10,
        50
      )}px`
    );
  }, []);

  return randomBorder;
};
