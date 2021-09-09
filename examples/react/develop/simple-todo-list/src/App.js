import React from 'react';
import { generateId } from '@agile-ts/core';
import { useAgile } from '@agile-ts/react';
import { TODOS } from './core';

const App = () => {
  // With the 'useAgile' Hook we bind our first Collection to the 'RandomComponent' for reactivity
  const todos = useAgile(TODOS);

  // Current Input of Name Form
  const [currentInput, setCurrentInput] = React.useState('');

  return (
    <div>
      <h3>Simple TODOS</h3>
      <input
        type="text"
        name="name"
        value={currentInput}
        onChange={(event) => {
          setCurrentInput(event.target.value);
        }}
      />
      <button
        onClick={() => {
          if (currentInput === '') return;

          // Add new Todo to the Collection based on the current Input
          TODOS.collect({ id: generateId(), name: currentInput }, [], {
            method: 'unshift', // to add todo at the beginning of the Collection
          });
          setCurrentInput('');
        }}>
        Add
      </button>
      {todos.map((value) => (
        <div key={value.id} style={{ marginBottom: 10 }}>
          <div>{value.name}</div>
          <button
            style={{ margin: 0 }}
            onClick={() => {
              // Remove Todo at specific primary Key
              TODOS.remove(value.id).everywhere();
            }}>
            Remove
          </button>
        </div>
      ))}
    </div>
  );
};

export default App;
