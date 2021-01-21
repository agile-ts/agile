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
  flatMerge,
} from '@agile-ts/core';

//=========================================================================================================
// AgileHOC
//=========================================================================================================
/**
 * @public
 * React HOC that binds Agile Instance like Collection, State, Computed, .. to a React Functional or Class Component
 * @param reactComponent - React Component to which the deps get bound
 * @param deps - Agile Instances that gets bind to the React Component
 * @param agileInstance - Agile Instance
 */
export function AgileHOC(
  reactComponent: ComponentClass<any, any>,
  deps: DepsType,
  agileInstance?: Agile
): ComponentClass<any, any> {
  let depsWithoutIndicator: Set<Observer> = new Set();
  let depsWithIndicator: DepsWithIndicatorType;

  // Format Deps
  if (isValidObject(deps)) {
    depsWithIndicator = formatDepsWithIndicator(deps as any);
  } else {
    const response = formatDepsWithNoSafeIndicator(deps as any);
    depsWithIndicator = response.depsWithIndicator;
    depsWithoutIndicator = response.depsWithoutIndicator;
  }

  // Try to get Agile Instance
  if (!agileInstance) {
    // From deps without Indicator
    if (depsWithoutIndicator.size > 0) {
      for (const dep of depsWithoutIndicator) {
        if (!agileInstance) agileInstance = getAgileInstance(dep);
      }
    }

    // From deps with Indicator
    if (!agileInstance) {
      for (const depKey in depsWithIndicator) {
        if (!agileInstance)
          agileInstance = getAgileInstance(depsWithIndicator[depKey]);
      }
    }
  }

  // If no Agile Instance found drop Error
  if (!agileInstance || !agileInstance.subController) {
    Agile.logger.error('Failed to subscribe Component with deps', deps);
    return reactComponent;
  }

  return createHOC(
    reactComponent,
    agileInstance,
    depsWithoutIndicator,
    depsWithIndicator
  );
}

//=========================================================================================================
// Create HOC
//=========================================================================================================
/**
 * @private
 * Creates Higher Order Component based on passed React Component that binds the deps to it
 * @param ReactComponent - React Component
 * @param agileInstance - Instance of Agile
 * @param depsWithoutIndicator - Deps that have no Indicator
 * @param depsWithIndicator - Deps that have an Indicator and get merged into the props of the React Component
 */
const createHOC = (
  ReactComponent: ComponentClass<any, any>,
  agileInstance: Agile,
  depsWithoutIndicator: Set<Observer>,
  depsWithIndicator: DepsWithIndicatorType
): ComponentClass<any, any> => {
  return class extends ReactComponent {
    public agileInstance: () => Agile;

    public componentSubscriptionContainers: Array<
      ComponentSubscriptionContainer
    > = []; // Will be set and used in sub.ts
    public agileProps = {}; // Props from Agile (get merged into normal Props)

    constructor(props: any) {
      super(props);
      this.agileInstance = (() => agileInstance) as any;
    }

    // We have to go the 'UNSAFE' way because the constructor of a React Component gets called twice
    // And because of that the subscriptionContainers get created twice (not clean)
    // We could generate a id for each component but this would also happen in the constructor so idk
    // https://github.com/facebook/react/issues/12906
    UNSAFE_componentWillMount() {
      // Create Subscription with Observer that have no Indicator and can't passed into this.state (Rerender will be caused via force Update)
      if (depsWithoutIndicator) {
        this.agileInstance().subController.subscribeWithSubsArray(
          this,
          Array.from(depsWithoutIndicator)
        );
      }

      // Create Subscription with Observer that have an Indicator (Rerender will be cause via mutating this.state)
      if (depsWithIndicator) {
        const response = this.agileInstance().subController.subscribeWithSubsObject(
          this,
          depsWithIndicator
        );
        this.agileProps = response.props;

        // Merge depsWith Indicator into this.state
        this.state = flatMerge(this.state || {}, depsWithIndicator);
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
      return React.createElement(
        ReactComponent,
        flatMerge(this.props, this.agileProps)
      );
    }
  };
};

//=========================================================================================================
// Format Deps With No Safe Indicator
//=========================================================================================================
/**
 * @private
 * Formats Deps that have no safe indicator and gets Observers from them.
 * It tries to use the existing Key of the Dep as Indicator.
 * @param deps - Deps that have no safe Indicator and get formatted
 */
const formatDepsWithNoSafeIndicator = (
  deps: Array<SubscribableAgileInstancesType> | SubscribableAgileInstancesType
): RegisterDepsWithNoSafeIndicatorResponseInterface => {
  const depsWithIndicator: DepsWithIndicatorType = {};
  const depsWithoutIndicator: Set<Observer> = new Set();
  const depsArray = normalizeArray(deps as any, {
    createUndefinedArray: true,
  });

  // Get Observers from Deps
  for (const dep of depsArray) {
    if (!dep) continue;

    // If Dep is Collection
    if (dep instanceof Collection) {
      depsWithoutIndicator.add(
        dep.getGroupWithReference(dep.config.defaultGroupKey).observer
      );
      continue;
    }

    // If Dep has property that is Observer
    if (dep['observer']) {
      depsWithoutIndicator.add(dep['observer']);
      continue;
    }

    // If Dep is Observer
    if (dep instanceof Observer) {
      depsWithoutIndicator.add(dep);
    }
  }

  // Add deps with key to depsWithIndicator and remove them from depsWithoutIndicator
  for (const dep of depsWithoutIndicator) {
    if (dep && dep['key']) {
      depsWithIndicator[dep['key']] = dep;
      depsWithoutIndicator.delete(dep);
    }
  }

  return {
    depsWithIndicator,
    depsWithoutIndicator,
  };
};

//=========================================================================================================
// Format Deps With Indicator
//=========================================================================================================
/**
 * @private
 * Format Deps that have an Indicator and gets Observers from them.
 * The key of a property in the object is the indicator.
 * @param deps - Deps that have an Indicator and get formatted
 */
const formatDepsWithIndicator = (deps: {
  [key: string]: SubscribableAgileInstancesType;
}): DepsWithIndicatorType => {
  const depsWithIndicator: DepsWithIndicatorType = {};

  // Get Observers from Deps
  for (const depKey in deps) {
    const dep = deps[depKey];
    if (!dep) continue; // undefined deps won't be represented in props anyway

    // If Dep is Collection
    if (dep instanceof Collection) {
      depsWithIndicator[depKey] = dep.getGroupWithReference(
        dep.config.defaultGroupKey
      ).observer;
      continue;
    }

    // If Dep has property that is an Observer
    if (dep['observer']) {
      depsWithIndicator[depKey] = dep['observer'];
      continue;
    }

    // If Dep is Observer
    if (dep instanceof Observer) {
      depsWithIndicator[depKey] = dep;
    }
  }

  return depsWithIndicator;
};

// Copy of the HOC class to have an typesafe base in the react.integration
export class AgileReactComponent extends React.Component {
  // public agileInstance: () => Agile;
  public componentSubscriptionContainers: Array<
    ComponentSubscriptionContainer
  > = [];
  public agileProps = {};

  constructor(props: any) {
    super(props);
  }
}

type SubscribableAgileInstancesType = State | Collection | Observer | undefined;
type DepsType =
  | Array<SubscribableAgileInstancesType>
  | { [key: string]: SubscribableAgileInstancesType }
  | SubscribableAgileInstancesType;

type DepsWithIndicatorType = { [key: string]: Observer };

interface RegisterDepsWithNoSafeIndicatorResponseInterface {
  depsWithoutIndicator: Set<Observer>;
  depsWithIndicator: DepsWithIndicatorType;
}
