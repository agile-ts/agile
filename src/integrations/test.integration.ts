import {State} from "../state";
import {Collection} from "../collection";
import Agile from "../index";
import {getAgileInstance, normalizeArray} from "../utils";


//=========================================================================================================
// Use Test Hook
// NOTE: This is only used for Tests
//=========================================================================================================

export function useTest(deps: Array<State | Collection> | State | Collection, callBackFunction: Function, agileInstance?: Agile) {
    // Normalize Dependencies
    let depsArray = normalizeArray<State | Collection>(deps)
        .map(item => item instanceof Collection ? item.getGroup(item.config.defaultGroupKey || 'default') : item);

    // Get Agile Instance
    if (!agileInstance) {
        const tempAgileInstance = getAgileInstance(depsArray[0]);
        if (!tempAgileInstance) {
            console.error("Agile: Failed to get Agile Instance");
            return undefined;
        }
        agileInstance = tempAgileInstance;
    }

    // Create a callback base subscription, Callback invokes re-render Trigger
    agileInstance?.subController.subscribeWithSubsArray(callBackFunction, depsArray);

    // Return Public Value of State
    if (depsArray.length === 1 && !Array.isArray(deps))
        return depsArray[0].getPublicValue();

    // Return Public Value of State in Array
    return depsArray.map(dep => {
        return dep.getPublicValue();
    });
}
