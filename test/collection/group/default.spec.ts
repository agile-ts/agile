import Agile from "../../../src";
import {useTest} from "../../../src/integrations/test.integration";
import {expect} from "chai";
import {Group} from "../../../src/collection/group";

describe('Default Group Tests', () => {
    // Define Agile
    const App = new Agile({
        framework: {
            name: 'test',
            bind: (agileInstance: Agile) => {
            },
            updateMethod: (componentInstance: any, updatedData: Object) => {
                // Note can't test updateMethod because for that we need a component (Rerenders will be tested with a callbackFunction)
            }
        }
    });

    describe('Group', () => {
        let rerenderCount = 0;

        // Object Interface
        interface userInterface {
            id: number
            name: string
        }

        // Create Collection
        const MY_COLLECTION = App.Collection<userInterface>(collection => ({
                groups: {
                    group1: collection.Group()
                }
            })
        );

        // Set 'Hook' for testing the rerenderFunctionality with the callbackFunction (Note: the value of myHookState doesn't get changed because no rerenders happen -> no reassign of the value)
        const [myGroup1] = useTest([MY_COLLECTION.getGroup('group1')], () => {
            rerenderCount++;
        });

        it('Has correct initial values', () => {
            expect(MY_COLLECTION.groups['default'] instanceof Group).to.eq(true, 'MY_COLLECTION default Group has been created');
            expect(JSON.stringify(MY_COLLECTION.groups['default'].value)).to.eq(JSON.stringify([]), 'default has correct initial value');
            expect(JSON.stringify(MY_COLLECTION.groups['default'].output)).to.eq(JSON.stringify([]), 'default has correct initial output');
            expect(JSON.stringify(MY_COLLECTION.groups['default'].states)).to.eq(JSON.stringify([]), 'default has correct initial states');
            expect(MY_COLLECTION.groups['default'].key).to.eq('default', 'group1 has correct initial key');

            expect(MY_COLLECTION.groups['group1'] instanceof Group).to.eq(true, 'MY_COLLECTION group1 Group has been created');
            expect(MY_COLLECTION.groups['group1']?.dep.subs.size === 1).to.eq(true, 'MY_COLLECTION group1 Group has correct subs size');
            expect(JSON.stringify(MY_COLLECTION.groups['group1'].value)).to.eq(JSON.stringify([]), 'group1 has correct initial value');
            expect(JSON.stringify(MY_COLLECTION.groups['group1'].output)).to.eq(JSON.stringify([]), 'group1 has correct initial output');
            expect(JSON.stringify(MY_COLLECTION.groups['group1'].states)).to.eq(JSON.stringify([]), 'group1 has correct initial states');
            expect(MY_COLLECTION.groups['group1'].key).to.eq('group1', 'group1 has correct initial key');

            expect(JSON.stringify(myGroup1)).to.eq(JSON.stringify([]), 'myGroup1 has correct MY_COLLECTION group1 value');
            expect(rerenderCount).to.eq(0, 'rerenderCount has correct value');
        });

        it('Has correct values after collecting items', async () => {
            // Collect Data
            MY_COLLECTION.collect([{id: 1, name: 'jeff'}, {id: 2, name: 'hans'}, {id: 3, name: 'frank'}]);

            // Needs some time to call callbackFunction
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(JSON.stringify(MY_COLLECTION.groups['default'].value)).to.eq(JSON.stringify([1, 2, 3]), 'default has correct value');
            expect(JSON.stringify(MY_COLLECTION.groups['default'].output)).to.eq(JSON.stringify([
                {id: 1, name: 'jeff'},
                {id: 2, name: 'hans'},
                {id: 3, name: 'frank'}
            ]), 'default has correct output');
            expect(JSON.stringify(MY_COLLECTION.groups['default'].states)).to.eq(JSON.stringify([
                MY_COLLECTION.findById(1),
                MY_COLLECTION.findById(2),
                MY_COLLECTION.findById(3)
            ]), 'default has correct states');
            expect(MY_COLLECTION.groups['default'].key).to.eq('default', 'group1 has correct initial key');

            expect(JSON.stringify(MY_COLLECTION.groups['group1'].value)).to.eq(JSON.stringify([]), 'group1 has correct value');
            expect(JSON.stringify(MY_COLLECTION.groups['group1'].output)).to.eq(JSON.stringify([]), 'group1 has correct output');
            expect(JSON.stringify(MY_COLLECTION.groups['group1'].states)).to.eq(JSON.stringify([]), 'group1 has correct states');
            expect(MY_COLLECTION.groups['group1'].key).to.eq('group1', 'group1 has correct key');

            expect(rerenderCount).to.eq(0, 'rerenderCount stayed the same');
        });
    });

    describe('Group with initial values', () => {
        let rerenderCount = 0;

        // Object Interface
        interface userInterface {
            id: number
            name: string
        }

        // Create Collection
        const MY_COLLECTION = App.Collection<userInterface>(collection => ({
                groups: {
                    group1: collection.Group([1, 2, 3])
                }
            })
        );

        // Set 'Hook' for testing the rerenderFunctionality with the callbackFunction (Note: the value of myHookState doesn't get changed because no rerenders happen -> no reassign of the value)
        const [myGroup1] = useTest([MY_COLLECTION.getGroup('group1')], () => {
            rerenderCount++;
        });

        it('Has correct initial values', () => {
            expect(MY_COLLECTION.groups['default'] instanceof Group).to.eq(true, 'MY_COLLECTION default Group has been created');
            expect(JSON.stringify(MY_COLLECTION.groups['default'].value)).to.eq(JSON.stringify([]), 'default has correct initial value');
            expect(JSON.stringify(MY_COLLECTION.groups['default'].output)).to.eq(JSON.stringify([]), 'default has correct initial output');
            expect(JSON.stringify(MY_COLLECTION.groups['default'].states)).to.eq(JSON.stringify([]), 'default has correct initial states');
            expect(MY_COLLECTION.groups['default'].key).to.eq('default', 'group1 has correct initial key');

            expect(MY_COLLECTION.groups['group1'] instanceof Group).to.eq(true, 'MY_COLLECTION group1 Group has been created');
            expect(MY_COLLECTION.groups['group1']?.dep.subs.size === 1).to.eq(true, 'MY_COLLECTION group1 Group has correct subs size');
            expect(JSON.stringify(MY_COLLECTION.groups['group1'].value)).to.eq(JSON.stringify([1, 2, 3]), 'group1 has correct initial value');
            expect(JSON.stringify(MY_COLLECTION.groups['group1'].output)).to.eq(JSON.stringify([]), 'group1 has correct initial output');
            expect(JSON.stringify(MY_COLLECTION.groups['group1'].states)).to.eq(JSON.stringify([]), 'group1 has correct initial states');
            expect(MY_COLLECTION.groups['group1'].key).to.eq('group1', 'group1 has correct initial key');

            expect(JSON.stringify(myGroup1)).to.eq(JSON.stringify([]), 'myGroup1 has correct MY_COLLECTION group1 value');
            expect(rerenderCount).to.eq(0, 'rerenderCount has correct value');
        });

        it('Has correct values after collecting items', async () => {
            // Collect Data
            MY_COLLECTION.collect([{id: 1, name: 'jeff'}, {id: 2, name: 'hans'}, {id: 3, name: 'frank'}]);

            // Needs some time to call callbackFunction
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(JSON.stringify(MY_COLLECTION.groups['default'].value)).to.eq(JSON.stringify([1, 2, 3]), 'default has correct value');
            expect(JSON.stringify(MY_COLLECTION.groups['default'].output)).to.eq(JSON.stringify([
                {id: 1, name: 'jeff'},
                {id: 2, name: 'hans'},
                {id: 3, name: 'frank'}
            ]), 'default has correct output');
            expect(JSON.stringify(MY_COLLECTION.groups['default'].states)).to.eq(JSON.stringify([
                MY_COLLECTION.findById(1),
                MY_COLLECTION.findById(2),
                MY_COLLECTION.findById(3)
            ]), 'default has correct states');
            expect(MY_COLLECTION.groups['default'].key).to.eq('default', 'group1 has correct initial key');

            expect(JSON.stringify(MY_COLLECTION.groups['group1'].value)).to.eq(JSON.stringify([1, 2, 3]), 'group1 has correct value');
            expect(JSON.stringify(MY_COLLECTION.groups['group1'].output)).to.eq(JSON.stringify([
                {id: 1, name: 'jeff'},
                {id: 2, name: 'hans'},
                {id: 3, name: 'frank'}
            ]), 'group1 has correct output');
            expect(JSON.stringify(MY_COLLECTION.groups['group1'].states)).to.eq(JSON.stringify([
                MY_COLLECTION.findById(1),
                MY_COLLECTION.findById(2),
                MY_COLLECTION.findById(3)
            ]), 'group1 has correct states');
            expect(MY_COLLECTION.groups['group1'].key).to.eq('group1', 'group1 has correct key');

            expect(rerenderCount).to.eq(1, 'rerenderCount has been increased by 1');
        });
    });

    describe('Group with key', () => {
        // Object Interface
        interface userInterface {
            id: number
            name: string
        }

        // Create Collection
        const MY_COLLECTION = App.Collection<userInterface>(collection => ({
                groups: {
                    group1: collection.Group([], {key: 'mywierdgroup'})
                }
            })
        );

        it('Has correct initial values', () => {
            expect(MY_COLLECTION.groups['group1'] instanceof Group).to.eq(true, 'MY_COLLECTION group1 Group has been created');
            expect(MY_COLLECTION.groups['group1'].key).to.eq('mywierdgroup', 'group1 has correct key');
        });
    });
});
