import {State} from "./index";
import Storage, {StorageKey} from "../storage";


//=========================================================================================================
// Persist Value
//=========================================================================================================
/**
 * Will persist the 'state' into the configured storage with the key or if no key passed the state key
 */
export async function persistValue(state: State, key?: StorageKey): Promise<boolean> {
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
    await handleStorageValue(key, storage, state);

    return true;
}


//=========================================================================================================
// Update Value
//=========================================================================================================
/**
 * Save current _value into storage if isPersistState
 */
export function updateValue(state: State) {
    if (state.isPersistState && state.key)
        state.agileInstance().storage.set(state.key, state._value);
}


//=========================================================================================================
// Helper
//=========================================================================================================

function validateKey(state: State, key?: StorageKey): StorageKey | null {
    // Get key from State key
    if (!key && state.key)
        return state.key;

    // Return null if no key can be found
    if (!key)
        return null;

    // Set this storage key as state key
    state.key = key;
    return key;
}

async function handleStorageValue(key: StorageKey, storage: Storage, state: State) {
    // Get storage Value
    const storageValue = await storage.get(key);

    // If the value doesn't exist in the storage yet.. create it
    if (!storageValue && state.key) {
        storage.set(state.key, state.getPersistableValue());
        return;
    }

    // If the value already exists in the storage.. load it into the state
    state.set(storageValue);
}
