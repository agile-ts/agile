import {
    State,
    Storage,
    StorageKey
} from '../internal';


//=========================================================================================================
// Persist Value
//=========================================================================================================
/**
 * Will persist the 'state' into the configured storage with the key or if no key passed the state key
 */
export async function persistValue(state: State, key?: StorageKey) {
    // Validate Key
    const tempKey = validateKey(state, key);
    if (!tempKey) {
        console.error("Agile: If your State has no key provided before using persist.. you have to provide a key here!");
        return;
    }
    key = tempKey;

    // Get Storage
    const storage = state.agileInstance().storage;

    // Check if persist State is already a isPersistState if so remove the old one
    if (state.persistSettings.isPersisted && state.persistSettings.persistKey)
        storage.remove(state.persistSettings.persistKey);

    // Add State to persistedStates in Storage
    storage.persistedStates.add(state);

    // Call Handle which decides weather it has to add the storage value to the state or save the state into the storage
    await handleStorageValue(key, storage, state);

    // Set persistSettings
    state.persistSettings = {
        isPersisted: true,
        persistKey: key
    }
}


//=========================================================================================================
// Update Value
//=========================================================================================================
/**
 * Save current _value into storage if isPersistState
 */
export function updateValue(state: State) {
    if (state.persistSettings.isPersisted && state.persistSettings.persistKey)
        state.agileInstance().storage.set(state.persistSettings.persistKey, state._value);
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

    // Set Storage key as State key if no state key exists
    if (!state.key)
        state.key = key;

    return key;
}

async function handleStorageValue(key: StorageKey, storage: Storage, state: State) {
    // Get storage Value
    const storageValue = await storage.get(key);

    // If the value doesn't exist in the storage yet.. create it
    if (!storageValue) {
        storage.set(key, state.getPersistableValue());
        return;
    }

    // If the value already exists in the storage.. load it into the state
    state.set(storageValue);
}
