import {State} from "../state";
import Agile from "..";
import {getAgileInstance, normalizeDeps} from "../utils";
import {Integration} from "./use";
import {SubscriptionContainer} from "../sub";


//=========================================================================================================
// Agile HOC for React classes
//=========================================================================================================

export function AgileHOC(ReactComponent: any, deps?: Array<State> | { [key: string]: State } | State, agileInstance?: Agile) {
    let depsArray: Array<State>;
    let depsObject: { [key: string]: State };

    if (deps instanceof State || Array.isArray(deps)) {
        // Normalize Dependencies
        depsArray = normalizeDeps(deps || []);

        // Get Agile Instance
        if (!agileInstance) {
            if (depsArray.length > 0) {
                const tempAgileInstance = getAgileInstance(depsArray[0]);
                agileInstance = tempAgileInstance || undefined;
            } else {
                console.warn("Agile: Please don't pass an empty array!");
            }
        }
    } else if (typeof deps === "object") {
        depsObject = deps;

        // Get Agile Instance
        if (!agileInstance) {
            const objectKeys = Object.keys(depsObject);
            if (objectKeys.length > 0) {
                const tempAgileInstance = getAgileInstance(depsObject[objectKeys[0]]);
                agileInstance = tempAgileInstance || undefined;
            } else {
                console.warn("Agile: Please don't pass an empty object!");
            }
        }
    } else {
        console.error("Agile: No Valid AgileHOC properties");
        return ReactComponent;
    }

    // Check if agile Instance exists
    if (!agileInstance) {
        console.error("Agile: Failed to get Agile Instance");
        return ReactComponent;
    }

    // Get React constructor
    const React = agileInstance.integration?.frameworkConstructor;
    if (!React) {
        console.error("Agile: Failed to get Framework Constructor");
        return ReactComponent;
    }

    return class extends React.Component {
        public componentContainer: SubscriptionContainer | null = null; // Will be set in registerSubscription (sub.ts)

        public updatedProps = this.props;

        constructor(props: any) {
            super(props);

            // Create HOC based Subscription with Array (Rerenders will here be caused via force Update)
            if (depsArray)
                agileInstance?.subController.subscribeWithSubsArray(this, depsArray);

            // Create HOC based Subscription with Object
            if (depsObject) {
                const response = agileInstance?.subController.subscribeWithSubsObject(this, depsObject);
                this.updatedProps = {
                    ...props,
                    ...response?.props
                }

                // Defines State for causing rerender (will be called in updateMethod)
                this.state = depsObject;
            }
        }

        componentDidMount() {
            if (agileInstance?.config.waitForMount)
                agileInstance?.subController.mount(this);
        }

        componentWillUnmount() {
            agileInstance?.subController.unsubscribe(this);
        }

        render() {
            return React.createElement(ReactComponent, this.updatedProps);
        }
    };
}


//=========================================================================================================
// Use Agile Hook
//=========================================================================================================

export function useAgile(deps: Array<State> | State, agileInstance?: Agile) {
    // Normalize Dependencies
    let depsArray = normalizeDeps(deps);

    // Get Agile Instance
    if (!agileInstance) {
        const tempAgileInstance = getAgileInstance(depsArray[0]);
        if (!tempAgileInstance) {
            console.error("Agile: Failed to get Agile Instance");
            return undefined;
        }
        agileInstance = tempAgileInstance;
    }

    // Get React constructor
    const React = agileInstance.integration?.frameworkConstructor;
    if (!React) {
        console.error("Agile: Failed to get Framework Constructor");
        return undefined;
    }

    // This is a Trigger State used to force the component to Re-render
    const [_, set_] = React.useState({});

    React.useEffect(function () {
        // Create a callback base subscription, Callback invokes re-render Trigger
        const subscriptionContainer = agileInstance?.subController.subscribeWithSubsArray(
            () => {
                set_({});
            },
            depsArray
        );

        // Unsubscribe on Unmount
        return () => agileInstance?.subController.unsubscribe(subscriptionContainer);
    }, []);

    // Return Public Value of State
    if (depsArray.length === 1)
        return depsArray[0].value;

    // Return Public Value of State in Array
    return depsArray.map(dep => {
        return dep.value;
    });
}


//=========================================================================================================
// Framework Integration
//=========================================================================================================

const reactIntegration: Integration = {
    name: 'react',
    bind(agileInstance: Agile) {
        // Not sure if usePulse should get into the pulseInstance
        // pulseInstance.usePulse = (deps: Array<State>) => usePulse(deps, pulseInstance);
        // if (agileInstance.config.logJobs) console.log("Agile: Successfully binded React to Agile")
    },
    updateMethod(componentInstance: any, updatedData: Object) {
        // UpdatedData will be empty if the AgileHOC doesn't get an object as deps

        if (Object.keys(updatedData).length !== 0) {
            // Update Props
            componentInstance.updatedProps = {...componentInstance.updatedProps, ...updatedData};

            // Set State
            componentInstance.setState(updatedData);
        } else {
            componentInstance.forceUpdate();
        }
    }
};

export default reactIntegration;
