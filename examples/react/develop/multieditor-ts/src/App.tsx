import React from 'react';
import './App.css';
import ErrorMessage from './components/ErrorMessage';
import { useMultieditor } from '@agile-ts/react';
import { signUpEditor } from './core/signUpEditor';
import { generateColor, generateId } from './core/utils';

let renderCount = 0;

const App = () => {
  const { submit, status, insertItem } = useMultieditor(signUpEditor);

  renderCount++;

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}>
      <h1>Sign Up</h1>
      <label>First Name:</label>
      <input{...insertItem('firstName')} />
      <ErrorMessage error={status('firstName')?.message} />

      <label>Last Name:</label>
      <input {...insertItem('lastName')} />
      <ErrorMessage error={status('lastName')?.message} />

      <label>Image</label>
      <div
        style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
        <div
          style={{
            backgroundColor: signUpEditor.getItemValue('image')?.color,
            width: 100,
            height: 100,
            borderRadius: 100,
          }}
        />
        <button
          style={{ marginLeft: 50 }}
          onClick={(event) => {
            event.preventDefault();
            signUpEditor.setValue(
              'image',
              {
                id: generateId(),
                color: generateColor(),
              },
              { background: false }
            );
          }}>
          Reset Image
        </button>
      </div>
      <ErrorMessage error={status('image')?.message} />

      <label>Gender</label>
      <select {...insertItem('gender')}>
        <option value={''}>Select...</option>
        <option value="male">Male</option>
        <option value="female">Female</option>
      </select>
      <ErrorMessage error={status('gender')?.message} />

      <label>Username</label>
      <input {...insertItem('userName')} />
      <ErrorMessage error={status('userName')?.message} />

      <label>Email</label>
      <input {...insertItem('email')} />
      <ErrorMessage error={status('email')?.message} />

      <label>Age</label>
      <input {...insertItem('age')} />
      <ErrorMessage error={status('age')?.message} />

      <label>About you</label>
      <textarea {...insertItem('aboutYou')} />
      <ErrorMessage error={status('aboutYou')?.message} />

      <input type="submit" />

      <p>Is Modified: {signUpEditor.isModified.toString()}</p>
      <p>Is Valid: {signUpEditor.isValid.toString()}</p>
      <p>Render Count: {renderCount}</p>
    </form>
  );
};

export default App;
