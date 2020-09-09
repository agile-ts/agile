import Group from "../../../collection/group";
import State from "../../../state";
import Collection from "../../../collection";
import Agile from "../../../index";
import {getAgileInstance, normalizeArray} from "../../../utils";

// Array Type
// https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-1.html
type AgileHookArrayType<T> = {
    [K in keyof T]: T[K] extends Group<infer U> ? U[]
        : T[K] extends State<infer U> ? U
            : T[K] extends Collection<infer U> ? U[]
                : T[K] extends undefined ? undefined
                    : never
};

// No Array Type
type AgileHookType<T> = T extends Group<infer U> ? U[]
    : T extends State<infer U> ? U
        : T extends Collection<infer U> ? U[]
            : T extends undefined ? undefined
                : never;

// Array
export function useAgile<X extends Array<State | Collection | undefined>>(deps: X, agileInstance?: Agile): AgileHookArrayType<X>;

// No Array
export function useAgile<X extends State | Collection | undefined>(deps: X, agileInstance?: Agile): AgileHookType<X>;

export function useAgile<X extends Array<State | Collection | undefined>, Y extends State | Collection | undefined>(deps: X | Y, agileInstance?: Agile): AgileHookArrayType<X> | AgileHookType<Y> {
    // Normalize Dependencies
    let depsArray = normalizeArray<State | Collection | undefined>(deps)
        .map(item => item instanceof Collection ? item.getGroup(item.config.defaultGroupKey || 'default') : item)
        .filter(item => item !== undefined) as State[];

    // Function which creates the return value
    const getReturnValue = (depsArray: State[]): AgileHookArrayType<X> | AgileHookType<Y> => {
        // Return Public Value of State
        if (depsArray.length === 1 && !Array.isArray(deps))
            return depsArray[0]?.getPublicValue() as AgileHookType<Y>;

        // Return Public Value of State in Array
        return depsArray.map(dep => {
            return dep.getPublicValue();
        }) as AgileHookArrayType<X>;
    }

    // Get Agile Instance
    if (!agileInstance) {
        const tempAgileInstance = getAgileInstance(depsArray[0]);
        if (!tempAgileInstance) {
            console.error("Agile: Failed to get Agile Instance");
            return getReturnValue(depsArray);
        }
        agileInstance = tempAgileInstance;
    }

    // Get React constructor
    const React = agileInstance.integration?.frameworkConstructor;
    if (!React) {
        console.error("Agile: Failed to get Framework Constructor");
        return getReturnValue(depsArray);
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

    return getReturnValue(depsArray);
}
