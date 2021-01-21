import { Agile, flatMerge, Integration } from '@agile-ts/core';
import { AgileReactComponent } from './hooks/AgileHOC';
import React from 'react';

const reactIntegration = new Integration<typeof React, AgileReactComponent>({
  key: 'react',
  frameworkInstance: React,
  bind() {
    // Nothing to bind ;D
    return Promise.resolve(true);
  },
  updateMethod(componentInstance, updatedData: Object) {
    // Merge changes into State if some Data updated otherwise force rerender
    if (Object.keys(updatedData).length !== 0) {
      componentInstance.agileProps = flatMerge(
        componentInstance.agileProps,
        updatedData
      );
      componentInstance.setState(
        flatMerge(componentInstance.state, updatedData)
      );
    } else {
      componentInstance.forceUpdate();
    }
  },
});
Agile.initialIntegrations.push(reactIntegration);

export default reactIntegration;
