import React from 'react';

export type Props = { height: number };

const Spacer: React.FC<Props> = (props) => {
  const height = props.height ?? 100; // '??' because props.height can also be 0 and 0 is false

  return <div style={{ height: height }} />;
};

export default Spacer;
