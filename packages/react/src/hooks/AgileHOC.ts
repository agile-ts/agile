import React, { ComponentClass } from 'react';
import {
  State,
  Agile,
  ComponentSubscriptionContainer,
  getAgileInstance,
  normalizeArray,
  Observer,
  Collection,
  isValidObject,
} from '@agile-ts/core';

type DepsType = State | Collection | Observer | undefined;

export function AgileHOC(
  ReactComponent: ComponentClass<any, any>,
  deps?: Array<DepsType> | { [key: string]: DepsType } | DepsType,
  agileInstance?: Agile
): ComponentClass<any, any> {
  const depsArray: Set<Observer> = new Set(); // Observers that have no key
  const depsObject: { [key: string]: Observer } = {}; // Observer that have key
  const areObjectDeps = isValidObject(deps);

  if (!areObjectDeps) {
    // Normalize Dependencies and special Agile Instance Types like Collection
    const tempDepsArray = normalizeArray(deps as any, {
      createUndefinedArray: true,
    });

    // Build Observer Deps Array
    for (const dep of tempDepsArray) {
      // If Dep is Collection
      if (dep instanceof Collection) {
        depsArray.add(
          dep.getGroupWithReference(dep.config.defaultGroupKey).observer
        );
      }

      // If Dep has property that is Observer
      if (dep['observer']) {
        depsArray.add(dep['observer']);
      }

      // If Dep is Observer
      if (dep instanceof Observer) {
        depsArray.add(dep);
      }
    }

    // Build Observer Deps Object out of Observers that have an Key
    for (const dep of depsArray) {
      if (dep && dep['key']) {
        depsObject[dep['key']] = dep;
      }
    }
  }

  if (areObjectDeps) {
    // Build Observer Deps Object
    for (const depKey in deps) {
      // If Dep is Collection
      if (deps[depKey] instanceof Collection) {
        deps[depKey] = deps[depKey].getGroupWithReference(
          deps[depKey].config.defaultGroupKey
        ).observer;
      }

      // If Dep has property that is an Observer
      if (deps[depKey]['observer']) {
        depsObject[depKey] = deps[depKey]['observer'];
      }

      // If Dep is Observer
      if (deps[depKey] instanceof Observer) {
        depsObject[depKey] = deps[depKey];
      }
    }

    // Build Observer Deps Array
    for (const dep in depsObject) {
      depsArray.add(depsObject[dep]);
    }
  }

  // Try to get Agile Instance
  if (!agileInstance) agileInstance = getAgileInstance(depsArray[0]);
  if (!agileInstance || !agileInstance.subController) {
    Agile.logger.error('Failed to subscribe Component with deps', depsArray);
    return ReactComponent;
  }

  return class extends ReactComponent {
    public agileInstance: () => Agile;

    public componentSubscriptionContainers: Array<
      ComponentSubscriptionContainer
    > = []; // Will be set and used in sub.ts

    public updatedProps = this.props;

    constructor(props: any) {
      super(props);
      this.agileInstance = (() => agileInstance) as any;

      // Remove Observer that are represented in depsObject
      const finalDepsArray = new Set(depsArray);
      for (const depKey in depsObject) {
        if (finalDepsArray.has(depsObject[depKey]))
          finalDepsArray.delete(depsObject[depKey]);
      }

      // Create Subscription with Observer in Array shape (Rerender will here be caused via force Update)
      if (finalDepsArray)
        this.agileInstance().subController.subscribeWithSubsArray(
          this,
          Array.from(finalDepsArray)
        );

      // Create Subscription with Observer in Object shape (Rerender will here be cause via mutating this.state)
      if (depsObject) {
        const response = this.agileInstance().subController.subscribeWithSubsObject(
          this,
          depsObject
        );
        response.subscriptionContainer;
        this.updatedProps = {
          ...props,
          ...response?.props,
        };

        // Assign default values to State
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
  } as any;
}

// Just for having a type save base in react.integration
export class AgileReactComponent extends React.Component {
  public componentSubscriptionContainer: ComponentSubscriptionContainer | null = null; // Will be set and used in sub.ts
  public updatedProps = this.props;

  constructor(props: any) {
    super(props);
  }
}
