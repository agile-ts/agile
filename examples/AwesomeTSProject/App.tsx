import React from 'react';
import {SafeAreaView, Text, StatusBar, Button} from 'react-native';
import {useAgile} from '@agile-ts/react';
import {MY_EVENT, MY_STATE} from './core';

const App = () => {
  const myState = useAgile(MY_STATE);

  return (
    <>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView>
        <Text style={{fontWeight: 'bold'}}>{myState}</Text>
        <Button
          title={'Change State'}
          onPress={() => {
            MY_STATE.set('Hello World');
          }}
        />
        <Button
          title={'Trigger Event'}
          onPress={() => {
            MY_EVENT.trigger({name: 'Jeff'});
          }}
        />
      </SafeAreaView>
    </>
  );
};

export default App;
