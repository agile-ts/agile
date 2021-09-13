import React from 'react';

export const FooComponent = ({ name }) => (
  <div>Hello from FooComponent, {name ?? 'unknown'}!</div>
);

export const BarComponent = ({ name }) => (
  <div>Hello from BarComponent, {name ?? 'unknown'}!</div>
);
