import 'mocha';
import {expect} from 'chai';
import Agile from "../../src";

describe('Default Collection Tests', () => {
    // Define Agile
    const App = new Agile();

    describe('Collection', () => {
        interface userInterface {
            id: number
            name: string
        }

        // Set Collections
        const MY_COLLECTION = App.Collection<userInterface>();

        it('Has correct initial values', () => {
            expect(MY_COLLECTION.key).to.eq(undefined, 'MY_COLLECTION has correct key');
            expect(MY_COLLECTION._key).to.eq(undefined, 'MY_COLLECTION has correct _key');
            expect(MY_COLLECTION.config.key).to.eq(undefined, 'MY_COLLECTION has correct config.key');
            expect(MY_COLLECTION.config.primaryKey).to.eq('id', 'MY_COLLECTION has correct config.primaryKey');
            expect(MY_COLLECTION.config.defaultGroupKey).to.eq('default', 'MY_COLLECTION has correct config.defaultGroupKey');
            expect(JSON.stringify(MY_COLLECTION.config.groups)).to.eq(JSON.stringify({}), 'MY_COLLECTION has no config.groups');
            expect(JSON.stringify(MY_COLLECTION.config.selectors)).to.eq(JSON.stringify({}), 'MY_COLLECTION has no config.selectors');
            expect(JSON.stringify(MY_COLLECTION.data)).to.eq(JSON.stringify({}), 'MY_COLLECTION has no data');
            expect(MY_COLLECTION.isPersistCollection).to.eq(false, 'MY_COLLECTION is no persisted Collection');
            expect(JSON.stringify(MY_COLLECTION.groups)).to.eq(JSON.stringify({}), 'MY_COLLECTION has no groups');
            expect(JSON.stringify(MY_COLLECTION.selectors)).to.eq(JSON.stringify({}), 'MY_COLLECTION has no selectors');
            expect(MY_COLLECTION.size).to.eq(0, 'MY_COLLECTION has correct size');
        });

        it('Can change key', () => {
            // Update key
            MY_COLLECTION.key = 'withKey';

            expect(MY_COLLECTION.key).to.eq('withKey', 'MY_STATE has correct key');
            expect(MY_COLLECTION._key).to.eq('withKey', 'My_STATE has correct _key');
        });
    });

    describe('Collection with Key', () => {
        interface userInterface2 {
            key: number
            name: string
        }

        // Set Collection
        const MY_COLLECTION_WITH_KEY = App.Collection<userInterface2>({
            primaryKey: 'key',
            key: 'myCollectionKey'
        });

        it('Has correct initial values', () => {
            expect(MY_COLLECTION_WITH_KEY.key).to.eq('myCollectionKey', 'MY_COLLECTION_WITH_KEY has correct key');
            expect(MY_COLLECTION_WITH_KEY._key).to.eq('myCollectionKey', 'MY_COLLECTION_WITH_KEY has correct _key');
            expect(MY_COLLECTION_WITH_KEY.config.key).to.eq('myCollectionKey', 'MY_COLLECTION_WITH_KEY has correct config.key');
            expect(MY_COLLECTION_WITH_KEY.config.primaryKey).to.eq('key', 'MY_COLLECTION_WITH_KEY has correct config.primaryKey');
            expect(MY_COLLECTION_WITH_KEY.config.defaultGroupKey).to.eq('default', 'MY_COLLECTION_WITH_KEY has correct config.defaultGroupKey');
            expect(JSON.stringify(MY_COLLECTION_WITH_KEY.config.groups)).to.eq(JSON.stringify({}), 'MY_COLLECTION_WITH_KEY has no config.groups');
            expect(JSON.stringify(MY_COLLECTION_WITH_KEY.config.selectors)).to.eq(JSON.stringify({}), 'MY_COLLECTION_WITH_KEY has no config.selectors');
        });

        it('Can change key', () => {
            // Update key
            MY_COLLECTION_WITH_KEY.key = 'withNewKey';

            expect(MY_COLLECTION_WITH_KEY.key).to.eq('withNewKey', 'MY_STATE_WITH_KEY has correct key');
            expect(MY_COLLECTION_WITH_KEY._key).to.eq('withNewKey', 'MY_STATE_WITH_KEY has correct _key');
        });
    });
});
