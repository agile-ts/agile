import React from 'react';
import Agile, {
  State,
  ComponentSubscriptionContainer,
  getAgileInstance,
  Observer,
  isValidObject,
  flatMerge,
  extractRelevantObservers,
  normalizeArray,
} from '@agile-ts/core';
import type { Collection } from '@agile-ts/core'; // Only import Collection and Group type for better Treeshaking
import { logCodeManager } from '../../logCodeManager';

/**
 * A Higher order Component for binding the most relevant value of multiple Agile Instances
 * (like the Collection's output or the State's value)
 * to a React Class Component.
 *
 * This binding ensures that the Component re-renders
 * whenever the most relevant value Observer of an Agile Instance mutates.
 *
 * @public
 * @param reactComponent - React Component to which the specified deps should be bound.
 * @param deps - Agile Sub Instances to be bound to the Class Component.
 * @param agileInstance - Instance of Agile the React Component belongs to.
 */
export function AgileHOC<
  ComponentProps,
  Deps extends DepsType,
  ComponentPropsWithDeps = ComponentProps & DepProps<Deps>
>(
  reactComponent: React.ComponentClass<ComponentProps, any>,
  deps: Deps,
  agileInstance?: Agile
): React.ComponentClass<ComponentProps, any> {
  let depsWithoutIndicator: Array<Observer> = [];
  let depsWithIndicator: DepsWithIndicatorType;

  // Format deps
  if (isValidObject(deps)) {
    depsWithIndicator = formatDepsWithIndicator(deps as any);
  } else {
    const response = formatDepsWithNoSafeIndicator(deps as any);
    depsWithIndicator = response.depsWithIndicator;
    depsWithoutIndicator = response.depsWithoutIndicator;
  }

  // Try to extract Agile Instance from the specified Instance/s
  if (!agileInstance) {
    if (depsWithoutIndicator.length > 0) {
      for (const dep of depsWithoutIndicator) {
        if (!agileInstance) agileInstance = getAgileInstance(dep);
      }
    }
    if (!agileInstance) {
      for (const depKey in depsWithIndicator) {
        if (!agileInstance)
          agileInstance = getAgileInstance(depsWithIndicator[depKey]);
      }
    }
  }
  if (!agileInstance || !agileInstance.subController) {
    logCodeManager.log('32:03:00', { replacers: [deps] });
    return reactComponent;
  }

  // Wrap a HOC around the specified Component
  return createHOC(
    reactComponent,
    agileInstance,
    depsWithoutIndicator,
    depsWithIndicator
  );
}

/**
 * Wraps a Higher order Component around the specified React Component
 * to bind the provided dependencies to the Component.
 *
 * @internal
 * @param ReactComponent - React Component to wrap the HOC around.
 * @param agileInstance - Instance of Agile the React Component belongs to.
 * @param depsWithoutIndicator - Dependencies that have no safe unique key/name indicator.
 * @param depsWithIndicator - Dependencies that have a unique key/name indicator.
 */
const createHOC = (
  ReactComponent: React.ComponentClass<any, any>,
  agileInstance: Agile,
  depsWithoutIndicator: Array<Observer>,
  depsWithIndicator: DepsWithIndicatorType
): React.ComponentClass<any, any> => {
  return class extends ReactComponent {
    public agileInstance: Agile;
    public waitForMount: boolean;

    public componentSubscriptionContainers: Array<ComponentSubscriptionContainer> =
      []; // Represents all Subscription Container subscribed to this Component (set by subController)
    public agileProps = {}; // Props of subscribed Agile Instances (are merged into the normal props)

    constructor(props: any) {
      super(props);
      this.agileInstance = agileInstance;
      this.waitForMount = agileInstance.config.waitForMount;
    }

    // We have to go the 'UNSAFE' way because the 'constructor' of a React Component is called twice.
    // Thus it would create the corresponding Subscription Container twice,
    // what should be avoided.
    // https://github.com/facebook/react/issues/12906
    UNSAFE_componentWillMount() {
      // Create Subscription with extracted Observers
      // that have no unique key/name indicator
      // and thus can't be merged into the 'this.state' property.
      // (Re-render will be enforced via a force update)
      if (depsWithoutIndicator.length > 0) {
        this.agileInstance.subController.subscribe(this, depsWithoutIndicator, {
          waitForMount: this.waitForMount,
        });
      }

      // Create Subscription with extracted Observers
      // that have a unique key/name indicator.
      // (Rerender will be enforced via mutating the 'this.state' property)
      if (depsWithIndicator) {
        const response = this.agileInstance.subController.subscribe(
          this,
          depsWithIndicator,
          { waitForMount: this.waitForMount }
        );
        this.agileProps = response.props;
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
 * which probably have no safe unique indicator key/name.
 *
 * If a unique key/name indicator could be found
 * the extracted Observer is added to the `depsWithIndicator` object
 * and otherwise to the `depsWithoutIndicator` array.
 *
 * What type of Observer is extracted from a dependency,
 * depends on the specified `observerType`.
 * If no `observerType` is specified, the Observers found in the dependency
 * are selected in the following `observerType` order.
 * 1. `output`
 * 2. `value`
 *
 * @internal
 * @param deps - Dependencies in array shape to extract the Observers from.
 * @param observerType - Type of Observer to be extracted.
 */
const formatDepsWithNoSafeIndicator = (
  deps: Array<SubscribableAgileInstancesType> | SubscribableAgileInstancesType,
  observerType?: string
): {
  depsWithoutIndicator: Observer[];
  depsWithIndicator: DepsWithIndicatorType;
} => {
  const depsArray = extractRelevantObservers(
    normalizeArray(deps),
    observerType
  );
  const depsWithIndicator: DepsWithIndicatorType = {};
  let depsWithoutIndicator: Observer[] = depsArray.filter(
    (dep): dep is Observer => dep !== undefined
  );

  // Try to extract a unique key/name identifiers from the extracted Observers
  depsWithoutIndicator = depsWithoutIndicator.filter((dep) => {
    if (dep && dep['key'] != null) {
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
 * which have a unique key/name identifier
 * through the object property key.
 *
 * What type of Observer is extracted from a dependency,
 * depends on the specified `observerType`.
 * If no `observerType` is specified, the Observers found in the dependency
 * are selected in the following `observerType` order.
 * 1. `output`
 * 2. `value`
 *
 * @internal
 * @param deps - Dependencies in object shape to extract the Observers from.
 * @param observerType - Type of Observer to be extracted.
 */
const formatDepsWithIndicator = (
  deps: {
    [key: string]: SubscribableAgileInstancesType;
  },
  observerType?: string
): DepsWithIndicatorType => {
  const depsObject = extractRelevantObservers(deps, observerType);
  const depsWithIndicator: DepsWithIndicatorType = {};
  for (const key in depsObject) {
    const observer = depsObject[key];
    if (observer != null) depsWithIndicator[key] = observer;
  }
  return depsWithIndicator;
};

// Copy of the HOC Class to have a typesafe interface of the AgileHOC in the React Integration
export class AgileReactComponent extends React.Component {
  // @ts-ignore
  public agileInstance: Agile;
  public componentSubscriptionContainers: Array<ComponentSubscriptionContainer> =
    [];
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

export type DepProps<T extends DepsType> = {
  [K in keyof T]: T[K] extends State<infer U> | Observer<infer U>
    ? U
    : T[K] extends Collection<infer U>
    ? U[]
    : never;
};
