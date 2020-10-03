import {Group, State, Collection, Agile, getAgileInstance, normalizeArray} from '../../../src';


//=========================================================================================================
// Use Test Hook
// NOTE: This is only used for Tests
//=========================================================================================================

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
export function useAgile_Test<X extends Array<State | Collection | undefined>>(deps: X, callbackFunction: Function, agileInstance?: Agile): AgileHookArrayType<X>;

// No Array
export function useAgile_Test<X extends State | Collection | undefined>(deps: X, callbackFunction: Function, agileInstance?: Agile): AgileHookType<X>;

export function useAgile_Test<X extends Array<State | Collection | undefined>, Y extends State | Collection | undefined>(deps: X | Y, callbackFunction: Function, agileInstance?: Agile): AgileHookArrayType<X> | AgileHookType<Y> {
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

    // Create a callback base subscription, Callback invokes re-render Trigger
    agileInstance?.subController.subscribeWithSubsArray(callbackFunction, depsArray);

    return getReturnValue(depsArray);
}
