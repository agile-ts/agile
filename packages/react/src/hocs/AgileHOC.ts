import React, { ComponentClass } from 'react';
import {
  State,
  Agile,
  ComponentSubscriptionContainer,
  getAgileInstance,
  Observer,
  Collection,
  isValidObject,
  flatMerge,
  extractRelevantObservers,
  normalizeArray,
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
  let depsWithoutIndicator: Array<Observer> = [];
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
    if (depsWithoutIndicator.length > 0) {
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
 * @internal
 * Creates Higher Order Component based on passed React Component that binds the deps to it
 * @param ReactComponent - React Component
 * @param agileInstance - Instance of Agile
 * @param depsWithoutIndicator - Deps that have no Indicator
 * @param depsWithIndicator - Deps that have an Indicator and get merged into the props of the React Component
 */
const createHOC = (
  ReactComponent: ComponentClass<any, any>,
  agileInstance: Agile,
  depsWithoutIndicator: Array<Observer>,
  depsWithIndicator: DepsWithIndicatorType
): ComponentClass<any, any> => {
  return class extends ReactComponent {
    public agileInstance: Agile;
    public waitForMount: boolean;

    public componentSubscriptionContainers: Array<
      ComponentSubscriptionContainer
    > = []; // Will be set and used in sub.ts
    public agileProps = {}; // Props from Agile (get merged into normal Props)

    constructor(props: any) {
      super(props);
      this.agileInstance = agileInstance;
      this.waitForMount = agileInstance.config.waitForMount;
    }

    // We have to go the 'UNSAFE' way because the constructor of a React Component gets called twice
    // And because of that the subscriptionContainers get created twice (not clean)
    // We could generate a id for each component but this would also happen in the constructor so idk
    // https://github.com/facebook/react/issues/12906
    UNSAFE_componentWillMount() {
      // Create Subscription with Observer that have no Indicator and can't be merged into 'this.state' (Rerender will be caused via force Update)
      if (depsWithoutIndicator.length > 0) {
        this.agileInstance.subController.subscribe(this, depsWithoutIndicator, {
          waitForMount: this.waitForMount,
        });
      }

      // Create Subscription with Observer that have an Indicator (Rerender will be cause via mutating 'this.state')
      if (depsWithIndicator) {
        const response = this.agileInstance.subController.subscribe(
          this,
          depsWithIndicator,
          { waitForMount: this.waitForMount }
        );
        this.agileProps = response.props;

        // Merge depsWith Indicator into this.state
        this.setState(flatMerge(this.state || {}, depsWithIndicator));
      }
    }

    componentDidMount() {
      if (this.waitForMount) this.agileInstance.subController.mount(this);
    }

    componentWillUnmount() {
      this.agileInstance.subController.unsubscribe(this);
    }

    render() {
      return React.createElement(
        ReactComponent,
        flatMerge(this.props, this.agileProps)
      );
    }
  };
};

/**
 * Extracts the Observers from the specified dependencies
 * which have no safe unique indicator key.
 *
 * If an indicator could be found
 * it is added to the `depsWithIndicator` object otherwise to the `depsWithoutIndicator` array.
 *
 * What type of Observer is extracted from a dependency
 * depends on the specified `observerType`.
 * If no `observerType` is specified, the Observers found in the dependency
 * are selected in the following `observerType` order.
 * - 1. `output`
 * - 2. `value`
 *
 * @internal
 * @param deps - Dependencies to extract the Observers from
 * @param observerType - Type of Observer to be extracted.
 */
const formatDepsWithNoSafeIndicator = (
  deps: Array<SubscribableAgileInstancesType> | SubscribableAgileInstancesType,
  observerType?: string
): {
  depsWithoutIndicator: Observer[];
  depsWithIndicator: DepsWithIndicatorType;
} => {
  const depsWithIndicator: DepsWithIndicatorType = {};
  let depsWithoutIndicator = extractRelevantObservers(
    normalizeArray(deps),
    observerType
  );

  // Add deps with key to 'depsWithIndicator' and remove them from 'depsWithoutIndicator'
  depsWithoutIndicator = depsWithoutIndicator.filter((dep) => {
    if (dep && dep['key']) {
      depsWithIndicator[dep['key']] = dep;
      return false;
    }
    return true;
  });

  return {
    depsWithIndicator,
    depsWithoutIndicator,
  };
};

/**
 * Extracts the Observers from the specified dependencies
 * which have a unique indicator key through the object property key.
 *
 * What type of Observer is extracted from a dependency
 * depends on the specified `observerType`.
 * If no `observerType` is specified, the Observers found in the dependency
 * are selected in the following `observerType` order.
 * - 1. `output`
 * - 2. `value`
 *
 * @internal
 * @param deps - Dependencies to extract the Observers from
 * @param observerType - Type of Observer to be extracted.
 */
const formatDepsWithIndicator = (
  deps: {
    [key: string]: SubscribableAgileInstancesType;
  },
  observerType?: string
): DepsWithIndicatorType => {
  return extractRelevantObservers(deps, observerType);
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

type SubscribableAgileInstancesType =
  | State
  | Collection<any> //https://stackoverflow.com/questions/66987727/type-classa-id-number-name-string-is-not-assignable-to-type-classar
  | Observer
  | undefined;

export type DepsType =
  | Array<SubscribableAgileInstancesType>
  | { [key: string]: SubscribableAgileInstancesType };
//  | SubscribableAgileInstancesType; // Not allowed because each passed Agile Instance is detect as object and will run through 'formatDepsWithIndicator'

type DepsWithIndicatorType = { [key: string]: Observer };
