import { Agile, Integration } from "@agile-ts/core";
import React from "react";

const reactIntegration = new Integration({
  name: "react",
  frameworkInstance: React,
  bind(agileInstance: Agile) {
    // Nothing to bind ;D
    return true;
  },
  updateMethod(componentInstance: any, updatedData: Object) {
    // UpdatedData will be empty if the AgileHOC doesn't get an object as deps

    if (Object.keys(updatedData).length !== 0) {
      // Update Props
      componentInstance.updatedProps = {
        ...componentInstance.updatedProps,
        ...updatedData,
      };

      // Set State
      componentInstance.setState(updatedData);
    } else {
      componentInstance.forceUpdate();
    }
  },
});
Agile.initialIntegrations.push(reactIntegration);

export default reactIntegration;
