import 'mocha';
import {expect} from 'chai';
import {Agile, Item} from "../../../src";
import {useAgile} from "../../../../react/tests";

describe('Remove Function Tests', () => {
    // Define Agile
    const App = new Agile();

    describe('Remove Function \'removeFromGroups\'', () => {
        let rerenderCount = 0;

        // Object Interface
        interface userInterface {
            id: number
            name: string
        }

        // Create Collection
        const MY_COLLECTION = App.Collection<userInterface>(collection => ({
                groups: {
                    group1: collection.Group([1, 2, 3]),
                    group2: collection.Group([1, 2, 3])
                }
            })
        );

        // Set 'Hook' for testing the rerenderFunctionality with the callbackFunction (Note: the value of myHookState doesn't get changed because no rerenders happen -> no reassign of the value)
        const [myGroup1, myGroup2] = useAgile([MY_COLLECTION.getGroup('group1'), MY_COLLECTION.getGroup('group2')], () => {
            rerenderCount++;
        });

        MY_COLLECTION.collect([{id: 1, name: 'jeff'}, {id: 2, name: 'hans'}, {id: 3, name: 'frank'}]);

        it('Has correct initial values', () => {
            expect(JSON.stringify(MY_COLLECTION.groups['group1'].value)).to.eq(JSON.stringify([1, 2, 3]), 'group1 has correct initial value');
            expect(JSON.stringify(MY_COLLECTION.groups['group2'].value)).to.eq(JSON.stringify([1, 2, 3]), 'group2 has correct initial value');
            expect(JSON.stringify(MY_COLLECTION.data[1].value)).to.eq(JSON.stringify({
                id: 1,
                name: 'jeff'
            }), 'MY_COLLECTION data contains item with id 1');
            expect(JSON.stringify(MY_COLLECTION.data[2].value)).to.eq(JSON.stringify({
                id: 2,
                name: 'hans'
            }), 'MY_COLLECTION data contains item with id 2');
            expect(JSON.stringify(MY_COLLECTION.data[3].value)).to.eq(JSON.stringify({
                id: 3,
                name: 'frank'
            }), 'MY_COLLECTION data contains item with id 3');
            expect(MY_COLLECTION.size).to.eq(3, 'MY_COLLECTION has correct size');

            expect(rerenderCount).to.eq(1, 'rerenderCount has correct value');
        });

        it('Can remove item which exist', async () => {
            // Remove item
            MY_COLLECTION.remove(1).fromGroups('group1');

            // Needs some time to call callbackFunction
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(JSON.stringify(MY_COLLECTION.groups['group1'].value)).to.eq(JSON.stringify([2, 3]), 'group1 has correct value');
            expect(JSON.stringify(MY_COLLECTION.groups['group2'].value)).to.eq(JSON.stringify([1, 2, 3]), 'group2 has correct value');
            expect(MY_COLLECTION.data[1] instanceof Item).to.eq(true, 'MY_COLLECTION has item with id 1');
            expect(MY_COLLECTION.size).to.eq(3, 'MY_COLLECTION has correct size');

            expect(rerenderCount).to.eq(2, 'rerenderCount has been increased by 1');
        });

        it('Can remove items which exist', async () => {
            // Remove items
            MY_COLLECTION.remove([2, 3]).fromGroups(['group1', 'group2']);

            // Needs some time to call callbackFunction
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(JSON.stringify(MY_COLLECTION.groups['group1'].value)).to.eq(JSON.stringify([]), 'group1 has correct value');
            expect(JSON.stringify(MY_COLLECTION.groups['group2'].value)).to.eq(JSON.stringify([1]), 'group2 has correct value');
            expect(MY_COLLECTION.data[2] instanceof Item).to.eq(true, 'MY_COLLECTION has item with id 2');
            expect(MY_COLLECTION.data[3] instanceof Item).to.eq(true, 'MY_COLLECTION has item with id 3');
            expect(MY_COLLECTION.size).to.eq(3, 'MY_COLLECTION has correct size');

            expect(rerenderCount).to.eq(3, 'rerenderCount has been increased by 1');
        });

        it('Can\'t remove item which doesn\'t exist', async () => {
            // Remove item
            MY_COLLECTION.remove(5).fromGroups('group1');

            // Needs some time to call callbackFunction
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(MY_COLLECTION.size).to.eq(3, 'MY_COLLECTION has correct size');

            expect(rerenderCount).to.eq(3, 'rerenderCount stayed the same');
        });

        it('Can\'t remove item which doesn\'t exist in group', async () => {
            // Remove item
            MY_COLLECTION.remove(1).fromGroups('group1');

            // Needs some time to call callbackFunction
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(JSON.stringify(MY_COLLECTION.groups['group1'].value)).to.eq(JSON.stringify([]), 'group1 has correct value');
            expect(MY_COLLECTION.data[1] instanceof Item).to.eq(true, 'MY_COLLECTION has item with id 1');
            expect(MY_COLLECTION.size).to.eq(3, 'MY_COLLECTION has correct size');

            expect(rerenderCount).to.eq(3, 'rerenderCount stayed the same');
        });

        it('Can\'t remove item from not existing group', async () => {
            // Remove item
            MY_COLLECTION.remove(2).fromGroups('notExisting');

            // Needs some time to call callbackFunction
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(MY_COLLECTION.data[2] instanceof Item).to.eq(true, 'MY_COLLECTION has item with id 2');
            expect(MY_COLLECTION.size).to.eq(3, 'MY_COLLECTION has correct size');

            expect(rerenderCount).to.eq(3, 'rerenderCount stayed the same');
        });
    });

    describe('Remove Function \'everywhere\'', () => {
        let rerenderCount = 0;

        // Object Interface
        interface userInterface {
            id: number
            name: string
        }

        // Create Collection
        const MY_COLLECTION = App.Collection<userInterface>(collection => ({
                groups: {
                    group1: collection.Group([1, 2, 3]),
                    group2: collection.Group([1, 2, 3])
                }
            })
        );

        // Set 'Hook' for testing the rerenderFunctionality with the callbackFunction (Note: the value of myHookState doesn't get changed because no rerenders happen -> no reassign of the value)
        const [myGroup1, myGroup2] = useAgile([MY_COLLECTION.getGroup('group1'), MY_COLLECTION.getGroup('group2')], () => {
            rerenderCount++;
        });

        MY_COLLECTION.collect([{id: 1, name: 'jeff'}, {id: 2, name: 'hans'}, {id: 3, name: 'frank'}]);

        it('Has correct initial values', () => {
            expect(JSON.stringify(MY_COLLECTION.groups['group1'].value)).to.eq(JSON.stringify([1, 2, 3]), 'group1 has correct initial value');
            expect(JSON.stringify(MY_COLLECTION.groups['group2'].value)).to.eq(JSON.stringify([1, 2, 3]), 'group2 has correct initial value');
            expect(JSON.stringify(MY_COLLECTION.data[1].value)).to.eq(JSON.stringify({
                id: 1,
                name: 'jeff'
            }), 'MY_COLLECTION data contains item with id 1');
            expect(JSON.stringify(MY_COLLECTION.data[2].value)).to.eq(JSON.stringify({
                id: 2,
                name: 'hans'
            }), 'MY_COLLECTION data contains item with id 2');
            expect(JSON.stringify(MY_COLLECTION.data[3].value)).to.eq(JSON.stringify({
                id: 3,
                name: 'frank'
            }), 'MY_COLLECTION data contains item with id 3');
            expect(MY_COLLECTION.size).to.eq(3, 'MY_COLLECTION has correct size');

            expect(rerenderCount).to.eq(1, 'rerenderCount has correct value');
        });

        it('Can remove item which exist', async () => {
            // Remove item
            MY_COLLECTION.remove(1).everywhere();

            // Needs some time to call callbackFunction
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(JSON.stringify(MY_COLLECTION.groups['group1'].value)).to.eq(JSON.stringify([2, 3]), 'group1 has correct value');
            expect(JSON.stringify(MY_COLLECTION.groups['group2'].value)).to.eq(JSON.stringify([2, 3]), 'group2 has correct value');
            expect(MY_COLLECTION.data[1] instanceof Item).to.eq(false, 'MY_COLLECTION hasn\'t item with id 1');
            expect(MY_COLLECTION.size).to.eq(2, 'MY_COLLECTION has correct size');

            expect(rerenderCount).to.eq(2, 'rerenderCount has been increased by 1');
        });

        it('Can remove items which exist', async () => {
            // Remove items
            MY_COLLECTION.remove([2, 3]).everywhere();

            // Needs some time to call callbackFunction
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(JSON.stringify(MY_COLLECTION.groups['group1'].value)).to.eq(JSON.stringify([]), 'group1 has correct value');
            expect(JSON.stringify(MY_COLLECTION.groups['group2'].value)).to.eq(JSON.stringify([]), 'group2 has correct value');
            expect(MY_COLLECTION.data[2] instanceof Item).to.eq(false, 'MY_COLLECTION hasn\'t item with id 2');
            expect(MY_COLLECTION.data[3] instanceof Item).to.eq(false, 'MY_COLLECTION hasn\'t item with id 3');
            expect(MY_COLLECTION.size).to.eq(0, 'MY_COLLECTION has correct size');

            expect(rerenderCount).to.eq(3, 'rerenderCount has been increased by 1');
        });

        it('Can\'t remove item which doesn\'t exist', async () => {
            // Remove item
            MY_COLLECTION.remove(5).everywhere();

            // Needs some time to call callbackFunction
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(MY_COLLECTION.size).to.eq(0, 'MY_COLLECTION has correct size');

            expect(rerenderCount).to.eq(3, 'rerenderCount stayed the same');
        });
    });
});
