import {State} from "./state";
import Agile from "./agile";


//=========================================================================================================
// Copy
//=========================================================================================================
/**
 * Copy an array or object.. without any dependencies
 */
export const copy = (val: any) => {
    if (typeof val === 'object') val = {...val};
    else if (Array.isArray(val)) val = [...val];

    return val;
};


//=========================================================================================================
// Normalize Deps
//=========================================================================================================
/**
 * Convert Dependencies into an array
 */
export function normalizeDeps(deps: Array<State> | State) {
    return Array.isArray(deps) ? (deps as Array<State>) : [deps as State];
}


//=========================================================================================================
// Get Instance
//=========================================================================================================
/**
 * Get the agileInstance of the State.. and if that doesn't exist get the global AgileInstance
 */
export function getAgileInstance(state: State): Agile | null {
    try {
        if (state.agileInstance) return state.agileInstance;
        // @ts-ignore
        else return globalThis.__agile;
    } catch (e) {
        // fail silently
    }

    return null
}
