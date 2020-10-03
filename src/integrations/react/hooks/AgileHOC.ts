import State from "../../../state";
import Agile from "../../../index";
import {getAgileInstance, normalizeArray} from "../../../utils";
import {SubscriptionContainer} from "../../../sub";

export function AgileHOC(ReactComponent: any, deps?: Array<State> | { [key: string]: State } | State, agileInstance?: Agile) {
    let depsArray: Array<State>;
    let depsObject: { [key: string]: State };

    if (deps instanceof State || Array.isArray(deps)) {
        // Normalize Dependencies
        depsArray = normalizeArray<State>(deps || []);

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
