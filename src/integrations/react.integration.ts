import {State} from "../state";
import Agile from "..";
import {getAgileInstance, normalizeDeps} from "../utils";
import {Integration} from "./use";
import {ComponentContainer, SubscriptionContainer} from "../sub";


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
            const tempAgileInstance = getAgileInstance(depsArray[0]);
            if (!tempAgileInstance) {
                console.error("Agile: Failed to get Agile Instance");
                return undefined;
            }
            agileInstance = tempAgileInstance;
        }
    } else if (typeof deps === "object") {
        depsObject = deps;
    } else {
        console.error("Agile: No Valid AgileHOC properties");
        return undefined;
    }

    // Check if agile Instance exists
    if (!agileInstance) {
        console.error("Agile: Failed to get Agile Instance");
        return undefined;
    }

    // Get React constructor
    const React = agileInstance.integration?.frameworkConstructor;
    if (!React) {
        console.error("Agile: Failed to get Framework Constructor");
        return undefined;
    }

    return class extends React.Component {
        public props: any;
        public componentContainer: SubscriptionContainer | null = null; // Will be set in registerComponent

        constructor(props: any) {
            super(props);
            this.props = props;

            // Create HOC based Subscription with Array
            if (depsArray) {
                agileInstance?.subController.subscribeWithSubsArray(this, depsArray, agileInstance);
            }

            // Create HOC based Subscription with Object
            if (depsObject) {
                const response = agileInstance?.subController.subscribeWithSubsObject(this, depsObject, agileInstance);
                this.props = {
                    ...props,
                    ...response?.props
                }
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
            return React.createElement(ReactComponent, this.props);
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
            return [undefined];
        }
        agileInstance = tempAgileInstance;
    }

    // Get React constructor
    const React = agileInstance.integration?.frameworkConstructor;
    if (!React) {
        console.error("Agile: Failed to get Framework Constructor");
        return [undefined];
    }

    // This is a Trigger State used to force the component to Re-render
    const [_, set_] = React.useState({});

    React.useEffect(function() {
        // Create a callback base subscription, Callback invokes re-render Trigger
        const subscriptionContainer = agileInstance?.subController.subscribeWithSubsArray(
            () => {
                set_({});
            },
            depsArray,
            agileInstance
        );

        // Unsubscribe on Unmount
        return () => agileInstance?.subController.unsubscribe(subscriptionContainer);
    }, []);

    // Return Public Value of State
    return depsArray.map(dep => {
        return dep.getPublicValue();
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
        if (agileInstance.config.logJobs) console.log("Agile: Successfully binded React to Agile")
    },
    updateMethod(componentInstance: any, updatedData: Object) {
        if (updatedData) {
            componentInstance.setState(updatedData);
        } else {
            componentInstance.forceUpdate();
        }
    }
};

export default reactIntegration;
