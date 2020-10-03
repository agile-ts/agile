import 'mocha';
import {expect} from 'chai';
import {Agile, Group, Selector} from "../../src";

describe('Default Collection Tests', () => {
    // Define Agile
    const App = new Agile();

    interface userInterface {
        id: number
        name: string
    }

    describe('Collection', () => {
        // Set Collections
        const MY_COLLECTION = App.Collection<userInterface>();

        it('Has correct initial values', () => {
            expect(MY_COLLECTION.config.key).to.eq(undefined, 'MY_COLLECTION has correct config.key');
            expect(MY_COLLECTION.config.primaryKey).to.eq('id', 'MY_COLLECTION has correct config.primaryKey');
            expect(MY_COLLECTION.config.defaultGroupKey).to.eq('default', 'MY_COLLECTION has correct config.defaultGroupKey');
            expect(JSON.stringify(MY_COLLECTION.config.groups)).to.eq(JSON.stringify({}), 'MY_COLLECTION has no config.groups');
            expect(JSON.stringify(MY_COLLECTION.config.selectors)).to.eq(JSON.stringify({}), 'MY_COLLECTION has no config.selectors');

            expect(MY_COLLECTION.key).to.eq(undefined, 'MY_COLLECTION has correct key');
            expect(MY_COLLECTION._key).to.eq(undefined, 'MY_COLLECTION has correct _key');
            expect(JSON.stringify(MY_COLLECTION.data)).to.eq(JSON.stringify({}), 'MY_COLLECTION has no data');
            expect(MY_COLLECTION.isPersistCollection).to.eq(false, 'MY_COLLECTION is no persisted Collection');
            expect(Object.keys(MY_COLLECTION.groups).length === 1 && MY_COLLECTION.groups["default"] !== undefined).to.eq(true, 'MY_COLLECTION has only default group');
            expect(JSON.stringify(MY_COLLECTION.selectors)).to.eq(JSON.stringify({}), 'MY_COLLECTION has no selectors');
            expect(MY_COLLECTION.size).to.eq(0, 'MY_COLLECTION has correct size');
        });

        it('Can change key', () => {
            // Update key
            MY_COLLECTION.key = 'myKey';

            expect(MY_COLLECTION.key).to.eq('myKey', 'MY_COLLECTION has correct key');
            expect(MY_COLLECTION._key).to.eq('myKey', 'MY_COLLECTION has correct _key');
        });
    });

    describe('Collection with Key', () => {
        // Set Collection
        const MY_COLLECTION = App.Collection<userInterface>({
            key: 'myCollectionKey'
        });

        it('Has correct initial values', () => {
            expect(MY_COLLECTION.key).to.eq('myCollectionKey', 'MY_COLLECTION has correct key');
            expect(MY_COLLECTION._key).to.eq('myCollectionKey', 'MY_COLLECTION has correct _key');
        });

        it('Can change key', () => {
            // Update key
            MY_COLLECTION.key = 'withNewKey';

            expect(MY_COLLECTION.key).to.eq('withNewKey', 'MY_COLLECTION has correct key');
            expect(MY_COLLECTION._key).to.eq('withNewKey', 'MY_COLLECTION has correct _key');
        });
    });

    describe('Collection with default Groups', () => {
        describe('Default Groups in Array shape', () => {
            // Set Collection
            const MY_COLLECTION = App.Collection<userInterface>({
                groups: ['group1', 'group2']
            });

            it('Has correct initial values', () => {
                expect(MY_COLLECTION.groups['group1'] instanceof Group).to.eq(true, 'MY_COLLECTION has group1 in groups');
                expect(MY_COLLECTION.groups['group2'] instanceof Group).to.eq(true, 'MY_COLLECTION has group2 in groups');
                expect(MY_COLLECTION.groups['group1'].key).to.eq('group1', 'group1 has correct key');
                expect(MY_COLLECTION.groups['group2'].key).to.eq('group2', 'group2 has correct key');
            });
        });

        describe('Default Groups in Object shape', () => {
            interface userInterface {
                id: number
                name: string
            }

            // Set Collection
            const MY_COLLECTION = App.Collection<userInterface>((collection) => ({
                groups: {
                    group1: collection.Group(),
                    group2: collection.Group()
                }
            }));

            it('Has correct initial values', () => {
                expect(MY_COLLECTION.groups['group1'] instanceof Group).to.eq(true, 'MY_COLLECTION has group1 in groups');
                expect(MY_COLLECTION.groups['group2'] instanceof Group).to.eq(true, 'MY_COLLECTION has group2 in groups');
                expect(MY_COLLECTION.groups['group1'].key).to.eq('group1', 'group1 has correct key');
                expect(MY_COLLECTION.groups['group2'].key).to.eq('group2', 'group2 has correct key');
            });
        });
    });

    describe('Collection with Key', () => {
        // Set Collection
        const MY_COLLECTION = App.Collection<userInterface>({
            key: 'myCollectionKey'
        });

        it('Has correct initial values', () => {
            expect(MY_COLLECTION.key).to.eq('myCollectionKey', 'MY_COLLECTION has correct key');
            expect(MY_COLLECTION._key).to.eq('myCollectionKey', 'MY_COLLECTION has correct _key');
        });

        it('Can change key', () => {
            // Update key
            MY_COLLECTION.key = 'withNewKey';

            expect(MY_COLLECTION.key).to.eq('withNewKey', 'MY_COLLECTION has correct key');
            expect(MY_COLLECTION._key).to.eq('withNewKey', 'MY_COLLECTION has correct _key');
        });
    });

    describe('Collection with default Selectors', () => {
        describe('Default Selector in Array shape', () => {
            // Set Collection
            const MY_COLLECTION = App.Collection<userInterface>({
                selectors: ['selector1', 'selector2']
            });

            it('Has correct initial values', () => {
                expect(MY_COLLECTION.selectors['selector1'] instanceof Selector).to.eq(true, 'MY_COLLECTION has selector1 in selectors');
                expect(MY_COLLECTION.selectors['selector2'] instanceof Selector).to.eq(true, 'MY_COLLECTION has selector2 in selectors');
                expect(MY_COLLECTION.selectors['selector1'].key).to.eq('selector1', 'selector1 has correct key');
                expect(MY_COLLECTION.selectors['selector2'].key).to.eq('selector2', 'selector2 has correct key');
            });
        });

        describe('Default Selectors in Object shape', () => {
            // Set Collection
            const MY_COLLECTION = App.Collection<userInterface>((collection) => ({
                selectors: {
                    selector1: collection.Selector('3'),
                    selector2: collection.Selector('2')
                }
            }));

            it('Has correct initial values', () => {
                expect(MY_COLLECTION.selectors['selector1'] instanceof Selector).to.eq(true, 'MY_COLLECTION has selector1 in selectors');
                expect(MY_COLLECTION.selectors['selector2'] instanceof Selector).to.eq(true, 'MY_COLLECTION has selector2 in selectors');
                expect(MY_COLLECTION.selectors['selector1'].key).to.eq('selector1', 'selector1 has correct key');
                expect(MY_COLLECTION.selectors['selector2'].key).to.eq('selector2', 'selector2 has correct key');
            });
        });
    });

    describe('Collection with primaryKey', () => {
        // Set Collection
        const MY_COLLECTION = App.Collection<userInterface>({
            primaryKey: 'key'
        });

        it('Has correct initial values', () => {
            expect(MY_COLLECTION.config.primaryKey).to.eq('key', 'MY_COLLECTION has correct primaryKey');
        });
    });

    describe('Collection with defaultGroupKey', () => {
        // Set Collection
        const MY_COLLECTION = App.Collection<userInterface>({
            defaultGroupKey: 'normal'
        });

        it('Has correct initial values', () => {
            expect(MY_COLLECTION.config.defaultGroupKey).to.eq('normal', 'MY_COLLECTION has correct defaultGroupKey');
            expect(MY_COLLECTION.groups['normal'] instanceof Group).to.eq(true, 'MY_COLLECTION has default group in groups')
        });
    });
});
