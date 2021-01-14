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
  const depsArray: Array<Observer> = []; // Observers that have no key
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
        depsArray.push(
          dep.getGroupWithReference(dep.config.defaultGroupKey).observer
        );
      }

      // If Dep has property that is Observer
      if (dep['observer']) {
        depsArray.push(dep['observer']);
      }

      // If Dep is Observer
      if (dep instanceof Observer) {
        depsArray.push(dep);
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
      depsArray.push(depsObject[dep]);
    }
  }

  // Try to get Agile Instance
  if (!agileInstance) agileInstance = getAgileInstance(depsArray[0]);
  if (!agileInstance || !agileInstance.subController) {
    Agile.logger.error('Failed to subscribe Component with deps', depsArray);
    return ReactComponent;
  }

  // TODO only subscribe with Array the observers that are not represented in object observers

  return class extends ReactComponent {
    public agileInstance: () => Agile;

    public componentSubscriptionContainer: ComponentSubscriptionContainer | null = null; // Will be set and used in sub.ts
    public updatedProps = this.props;

    constructor(props: any) {
      super(props);
      this.agileInstance = (() => agileInstance) as any;

      // Create HOC based Subscription with Array (Rerender will here be caused via force Update)
      if (depsArray)
        this.agileInstance().subController.subscribeWithSubsArray(
          this,
          depsArray
        );

      // Create HOC based Subscription with Object
      if (depsObject) {
        const response = this.agileInstance().subController.subscribeWithSubsObject(
          this,
          depsObject
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
