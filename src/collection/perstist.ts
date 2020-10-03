import Collection, {ItemKey} from "./index";
import Storage, {StorageKey} from "../storage";
import {GroupKey} from "./group";

interface CollectionStorageData {
    data: ItemKey[],
    groups: GroupKey[]
}

const storageItemKeyTemplate = '_${collectionKey}_item_${itemKey}';
const storageGroupKeyTemplate = '_${collectionKey}_group_${groupKey}';

//=========================================================================================================
// Persist Value
//=========================================================================================================
/**
 * Will persist the 'collection' into the configured storage with the key or if no key passed the state key
 */
export async function persistValue(collection: Collection, key?: StorageKey): Promise<boolean> {
    // Validate Key
    const tempKey = validateKey(collection, key);
    if (!tempKey) {
        console.error("Agile: If your State has no key provided before using persist.. you have to provide a key here!");
        return false;
    }
    key = tempKey;

    // Get Storage
    const storage = collection.agileInstance().storage;

    // Add Collection to persistedCollections in Storage
    storage.persistedCollections.add(collection);

    // Call Handle which decides weather it has to add the storage value to the state or save the state into the storage
    await handleStorageValue(storage, collection);

    return true;
}


//=========================================================================================================
// Set/Update Item
//=========================================================================================================
/**
 * Set/Update Item in Storage
 */
export async function setItem(itemKey: ItemKey, collection: Collection) {
    const storage = collection.agileInstance().storage;

    if (collection.isPersistCollection && collection.key) {
        // Create Item Storage Key
        const itemStorageKey = storageItemKeyTemplate
            .replace('${collectionKey}', (collection.key || 'unknown').toString())
            .replace('${itemKey}', itemKey.toString());

        // Get Value
        const item = collection.data[itemKey];
        if (!item) return;

        // Log Job
        if (collection.agileInstance().config.logJobs)
            console.log(`Agile Storage(Set Item): ${itemStorageKey}`, item.getPersistableValue());

        // Set StorageValue
        await storage.set(itemStorageKey, item.getPersistableValue());
    }
}


//=========================================================================================================
// Remove Item
//=========================================================================================================
/**
 * Removes Item from Storage
 */
export function removeItem(itemKey: ItemKey, collection: Collection) {
    const storage = collection.agileInstance().storage;

    if (collection.isPersistCollection && collection.key) {
        // Create Item Storage Key
        const itemStorageKey = storageItemKeyTemplate
            .replace('${collectionKey}', (collection.key || 'unknown').toString())
            .replace('${itemKey}', itemKey.toString());

        // Log Job
        if (collection.agileInstance().config.logJobs)
            console.log(`Agile Storage(Remove Item): ${itemStorageKey}`);

        // Remove StorageValue
        storage.remove(itemStorageKey);
    }
}


//=========================================================================================================
// Update Group
//=========================================================================================================
/**
 * Updates the Group in the storage
 */
export function updateGroup(groupKey: GroupKey, collection: Collection) {
    const storage = collection.agileInstance().storage;

    if (collection.isPersistCollection && collection.key) {
        // Create Group Storage Key
        const groupStorageKey = storageGroupKeyTemplate
            .replace('${collectionKey}', (collection.key || 'unknown').toString())
            .replace('${groupKey}', groupKey.toString());

        // Get group
        const group = collection.groups[groupKey];
        if (!group) return;

        // Log Job
        if (collection.agileInstance().config.logJobs)
            console.log(`Agile Storage(Update Group): ${groupStorageKey}`, group.value);

        // Set StorageValue
        storage.set(groupStorageKey, group.value);
    }
}


//=========================================================================================================
// Helper
//=========================================================================================================

function validateKey(collection: Collection, key?: StorageKey): StorageKey | null {
    // Get key from State key
    if (!key && collection.key)
        return collection.key;

    // Return null if no key can be found
    if (!key)
        return null;

    // Set this storage key as state key
    collection.key = key;
    return key;
}

async function handleStorageValue(storage: Storage, collection: Collection) {
    // Get Collection Data
    const collectionData = await loadCollectionData(collection);

    // Log Job
    if (collection.agileInstance().config.logJobs)
        console.log("Agile Storage(CollectionData):", collectionData);

    // Load Collection Items
    await loadCollectionItems(collectionData, collection);

    // Load Collection Groups
    await loadCollectionGroups(collectionData, collection);
}

async function loadCollectionData(collection: Collection): Promise<CollectionStorageData> {
    const storage = collection.agileInstance().storage;

    const key = collection.key as StorageKey;
    const storageValue = await storage.get(key);

    // If the collectionData doesn't exist in the storage yet.. create it
    if (!storageValue) {
        const collectionStorageData: CollectionStorageData = {
            data: Object.keys(collection.data),
            groups: Object.keys(collection.groups)
        }
        storage.set(key, collectionStorageData);
        return collectionStorageData;
    }

    return storageValue;
}

async function loadCollectionItems(collectionStorageData: CollectionStorageData, collection: Collection) {
    const storage = collection.agileInstance().storage;

    for (let itemKey of collectionStorageData.data) {
        // Create Item Storage Key
        const itemStorageKey = storageItemKeyTemplate
            .replace('${collectionKey}', (collection.key || 'unknown').toString())
            .replace('${itemKey}', itemKey.toString());

        // Get StorageValue
        const storageValue = await storage.get(itemStorageKey);

        // Log Job
        if (collection.agileInstance().config.logJobs)
            console.log(`Agile Storage: ${itemStorageKey}`, storageValue);

        // If the value doesn't exist in the storage yet.. create it
        if (!storageValue) {
            storage.set(itemStorageKey, collection.data[itemKey].getPersistableValue());
            return;
        }

        // If the value already exists in the storage.. load it into the collection
        collection.collect(storageValue);
    }
}

async function loadCollectionGroups(collectionStorageData: CollectionStorageData, collection: Collection) {
    const storage = collection.agileInstance().storage;

    for (let groupKey of collectionStorageData.groups) {
        // Create Group Storage Key
        const groupStorageKey = storageGroupKeyTemplate
            .replace('${collectionKey}', (collection.key || 'unknown').toString())
            .replace('${groupKey}', groupKey.toString());

        // Get StorageValue
        const storageValue = await storage.get(groupStorageKey);

        // Log Job
        if (collection.agileInstance().config.logJobs)
            console.log(`Agile Storage: ${groupStorageKey}`, storageValue);

        // If the value doesn't exist in the storage yet.. create it
        if (!storageValue) {
            storage.set(groupStorageKey, collection.groups[groupKey].value);
            return;
        }

        // - If the value already exists in the storage.. load it into the collection

        // Get Group
        const group = collection.groups[groupKey];

        // If group doesn't exists, Create Group
        if (!group) {
            collection.createGroup(groupKey, storageValue);
            continue;
        }

        // If group exists, add items into group
        for (let key of storageValue) {
            if (!group.has(key)) {
                group.add(key);
            }
        }
    }
}
