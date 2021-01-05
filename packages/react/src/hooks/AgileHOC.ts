import React from 'react';
import {
  State,
  Agile,
  ComponentSubscriptionContainer,
  getAgileInstance,
  normalizeArray,
  Observer,
} from '@agile-ts/core';

export function AgileHOC(
  ReactComponent: any,
  deps?: Array<State> | {[key: string]: State} | State,
  agileInstance?: Agile,
) {
  let depsArray: Array<Observer>;
  let depsObject: {[key: string]: Observer} = {};

  if (deps instanceof State || Array.isArray(deps)) {
    // Normalize Dependencies
    depsArray = normalizeArray<State>(deps || []).map((dep) => dep.observer);

    // Get Agile Instance
    if (!agileInstance) {
      if (depsArray.length > 0) {
        const tempAgileInstance = getAgileInstance(depsArray[0]);
        agileInstance = tempAgileInstance || undefined;
      } else {
        Agile.logger.error("Please don't pass an empty array!");
      }
    }
  } else if (typeof deps === 'object') {
    for (let dep in deps) {
      depsObject[dep] = deps[dep].observer;
    }

    // Get Agile Instance
    if (!agileInstance) {
      const objectKeys = Object.keys(depsObject);
      if (objectKeys.length > 0) {
        const tempAgileInstance = getAgileInstance(depsObject[objectKeys[0]]);
        agileInstance = tempAgileInstance || undefined;
      } else {
        Agile.logger.error("Please don't pass an empty object!");
      }
    }
  } else {
    Agile.logger.error('No Valid AgileHOC properties');
    return ReactComponent;
  }

  // Check if agile Instance exists
  if (!agileInstance) {
    Agile.logger.error('Failed to get Agile Instance');
    return ReactComponent;
  }

  return class extends ReactComponent {
    public agileInstance: () => Agile;

    public componentSubscriptionContainer: ComponentSubscriptionContainer | null = null; // Will be set and used in sub.ts
    public updatedProps = this.props;

    constructor(props: any) {
      super(props);
      this.agileInstance = (() => agileInstance) as any;

      // Create HOC based Subscription with Array (Rerenders will here be caused via force Update)
      if (depsArray)
        this.agileInstance().subController.subscribeWithSubsArray(
          this,
          depsArray,
        );

      // Create HOC based Subscription with Object
      if (depsObject) {
        const response = this.agileInstance().subController.subscribeWithSubsObject(
          this,
          depsObject,
        );
        this.updatedProps = {
          ...props,
          ...response?.props,
        };

        // Defines State for causing rerender (will be called in updateMethod)
        this.state = depsObject;
      }
    }

    componentDidMount() {
      if (this.agileInstance().config.waitForMount)
        this.agileInstance().subController.mount(this);
    }

    componentWillUnmount() {
      this.agileInstance().subController.unsubscribe(this);
    }

    render() {
      return React.createElement(ReactComponent, this.updatedProps);
    }
  };
}

// Just for having a type save base in react.integration
export class AgileReactComponent extends React.Component {
  public componentSubscriptionContainer: ComponentSubscriptionContainer | null = null; // Will be set and used in sub.ts
  public updatedProps = this.props;

  constructor(props: any) {
    super(props);
  }
}
