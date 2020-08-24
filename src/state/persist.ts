import {State, StateKey} from "./index";
import Storage, {StorageKey} from "../storage";


//=========================================================================================================
// Persist Value
//=========================================================================================================
/**
 * Will persist the 'state' into the configured storage with the key or if no key passed the state key
 */
export function persistValue(state: State, key?: StateKey): boolean {
    // Validate Key
    const tempKey = validateKey(state, key);
    if (!tempKey) {
        console.error("Agile: If your State has no key provided before using persist.. you have to provide a key here!");
        return false;
    }
    key = tempKey;

    // Get Storage
    const storage = state.agileInstance().storage;

    // Add State to persistedStates in Storage
    storage.persistedStates.add(state);

    // Call Handle which decides weather it has to add the storage value to the state or save the state into the storage
    if (storage.isAsync)
        storage.get(key).then((value: any) => handleStorageValue(value, storage, state));
    else
        handleStorageValue(storage.get(key), storage, state);

    return true;
}


//=========================================================================================================
// Helper
//=========================================================================================================

function validateKey(state: State, key?: StateKey): StorageKey | null {
    // Get key from State key
    if (!key && state._key)
        return state._key;

    // Return null if no key can be found
    if (!key)
        return null;

    // Set this storage key as state key
    state._key = key;
    return key;
}

function handleStorageValue(storageVal: any, storage: Storage, state: State) {
    // If the value doesn't exist in the storage yet.. create it
    if (storageVal === null) {
        storage.set(state._key || '', state.getPersistableValue());
        return;
    }

    // If the value already exists in the storage.. load it into the state
    state.agileInstance().runtime.ingest(state, storageVal);
}
