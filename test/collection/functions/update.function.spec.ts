import 'mocha';
import {expect} from 'chai';
import Agile from "../../../src";
import {useTest} from "../../../src/integrations/test/test.integration";
import Group from "../../../src/collection/group";

describe('Update Function Tests', () => {
    let rerenderCount = 0;

    // Define Agile
    const App = new Agile({
        framework: {
            name: 'test',
            bind: (agileInstance: Agile) => {
            },
            updateMethod: (componentInstance: any, updatedData: Object) => {
                // Note can't test updateMethod because for that we need a component (Rerenders will be tested with a callbackFunction)
            }
        },
    });

    // Object Interface
    interface userInterface {
        id: number
        name: string
        age?: number
    }

    // Create Collection
    const MY_COLLECTION = App.Collection<userInterface>();

    // Set 'Hook' for testing the rerenderFunctionality with the callbackFunction (Note: the value of myHookState doesn't get changed because no rerenders happen -> no reassign of the value)
    const [myHookCollection] = useTest([MY_COLLECTION], () => {
        rerenderCount++;
    });

    // Collect some items
    MY_COLLECTION.collect([{id: 1, name: 'jeff'}, {id: 2, name: 'jamie'}, {id: 3, name: 'hans'}])

    it('Has correct initial values', () => {
        expect(MY_COLLECTION.groups['default'] instanceof Group).to.eq(true, 'MY_COLLECTION default Group has been created')
        expect(MY_COLLECTION.groups['default']?.dep.subs.size === 1).to.eq(true, 'MY_COLLECTION default Group has correct subs size');
        expect(MY_COLLECTION.size).to.eq(3, 'MY_COLLECTION has correct size');
        expect(JSON.stringify(MY_COLLECTION.data[1].value)).to.eq(JSON.stringify({
            id: 1,
            name: 'jeff'
        }), 'MY_COLLECTION item at id 1 has correct value');
        expect(JSON.stringify(MY_COLLECTION.data[2].value)).to.eq(JSON.stringify({
            id: 2,
            name: 'jamie'
        }), 'MY_COLLECTION item at id 2 has correct value');
        expect(JSON.stringify(MY_COLLECTION.data[3].value)).to.eq(JSON.stringify({
            id: 3,
            name: 'hans'
        }), 'MY_COLLECTION item at id 3 has correct value');

        expect(JSON.stringify(myHookCollection)).to.eq(JSON.stringify([]), 'myHookState has correct MY_COLLECTION value');
        expect(rerenderCount).to.eq(1, 'rerenderCount has correct value');
    });

    it('Can update Item', async () => {
        // Update Item
        MY_COLLECTION.update(1, {name: 'updatedJeff'});

        // Needs some time to call callbackFunction
        await new Promise(resolve => setTimeout(resolve, 100));

        expect(JSON.stringify(MY_COLLECTION.data[1]?.value)).to.eq(JSON.stringify({
            id: 1,
            name: 'updatedJeff'
        }), 'MY_COLLECTION data at id 1 has updated');
        expect(Object.keys(MY_COLLECTION.data).length).to.eq(3, 'MY_COLLECTION has still all items')

        expect(rerenderCount).to.eq(2, 'rerenderCount has been increased by 1');
    });

    it('Can update Item and primaryKey', async () => {
        // Update Item
        MY_COLLECTION.update(3, {id: 4, name: 'updatedHans'});

        // Needs some time to call callbackFunction
        await new Promise(resolve => setTimeout(resolve, 100));

        expect(JSON.stringify(MY_COLLECTION.data[4]?.value)).to.eq(JSON.stringify({
            id: 4,
            name: 'updatedHans'
        }), 'MY_COLLECTION data switched from id 3 to id 4 and has updated');
        expect(MY_COLLECTION.data[3]).to.eq(undefined, 'MY_COLLECTION item at id 3 doesn\'t exist anymore');
        expect(Object.keys(MY_COLLECTION.data).length).to.eq(3, 'MY_COLLECTION has still all items');
        expect(MY_COLLECTION.groups["default"].value.findIndex(value => value === 3) !== -1).to.eq(false, 'MY_COLLECTION item with id 3 doesn\'t exist in default group anymore');
        expect(MY_COLLECTION.groups["default"].value.findIndex(value => value === 4) !== -1).to.eq(true, 'MY_COLLECTION item with id 3 does exist in default group');

        expect(rerenderCount).to.eq(3, 'rerenderCount has been increased by 1');
    });

    it('Can\'t update not existing Item', async () => {
        // Update Item
        MY_COLLECTION.update(5, {name: 'updatedName'});

        // Needs some time to call callbackFunction
        await new Promise(resolve => setTimeout(resolve, 100));

        expect(Object.keys(MY_COLLECTION.data).length).to.eq(3, 'MY_COLLECTION has still all items');

        expect(rerenderCount).to.eq(3, 'rerenderCount has stayed the same');
    });

    it('Can\'t update Item with the same value', async () => {
        // Update Item
        MY_COLLECTION.update(1, {name: 'updatedJeff'});

        // Needs some time to call callbackFunction
        await new Promise(resolve => setTimeout(resolve, 100));

        expect(JSON.stringify(MY_COLLECTION.data[1]?.value)).to.eq(JSON.stringify({
            id: 1,
            name: 'updatedJeff'
        }), 'MY_COLLECTION data at id 1 stayed the same');
        expect(Object.keys(MY_COLLECTION.data).length).to.eq(3, 'MY_COLLECTION has still all items')

        expect(rerenderCount).to.eq(3, 'rerenderCount has stayed the same');
    });

    it('Can\'t update Item with non object changes', async () => {
        // Update Item
        // @ts-ignore
        MY_COLLECTION.update(1, 'hi');

        // Needs some time to call callbackFunction
        await new Promise(resolve => setTimeout(resolve, 100));

        expect(Object.keys(MY_COLLECTION.data).length).to.eq(3, 'MY_COLLECTION has still all items');

        expect(rerenderCount).to.eq(3, 'rerenderCount has stayed the same');
    });

    describe('Test background option', () => {
        it('Does call callBackFunction by updating Item with background = false', async () => {
            // Update Item
            MY_COLLECTION.update(2, {name: 'updatedJamie'}, {background: false});

            // Needs some time to call callbackFunction
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(JSON.stringify(MY_COLLECTION.data[2]?.value)).to.eq(JSON.stringify({
                id: 2,
                name: 'updatedJamie'
            }), 'MY_COLLECTION data at id 2 has updated');
            expect(Object.keys(MY_COLLECTION.data).length).to.eq(3, 'MY_COLLECTION has still all items')

            expect(rerenderCount).to.eq(4, 'rerenderCount has been increased by 1');
        });

        it('Doesn\'t call callBackFunction by updating Item with background = true', async () => {
            // Update Item
            MY_COLLECTION.update(4, {id: 4, name: 'updatedHans2'}, {background: true});

            // Needs some time to call callbackFunction
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(JSON.stringify(MY_COLLECTION.data[4]?.value)).to.eq(JSON.stringify({
                id: 4,
                name: 'updatedHans2'
            }), 'MY_COLLECTION data at id 4 has updated');
            expect(Object.keys(MY_COLLECTION.data).length).to.eq(3, 'MY_COLLECTION has still all items')

            expect(rerenderCount).to.eq(4, 'rerenderCount stayed the same');
        });

        it('Doesn\'t call callBackFunction by updating Item and primaryKey with background = true', async () => {
            // Update Item
            MY_COLLECTION.update(4, {id: 3, name: 'updatedHans3'}, {background: true});

            // Needs some time to call callbackFunction
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(JSON.stringify(MY_COLLECTION.data[3]?.value)).to.eq(JSON.stringify({
                id: 3,
                name: 'updatedHans3'
            }), 'MY_COLLECTION data switched from id 4 to id 3 and has updated');
            expect(Object.keys(MY_COLLECTION.data).length).to.eq(3, 'MY_COLLECTION has still all items')

            expect(rerenderCount).to.eq(4, 'rerenderCount stayed the same');
        });
    });

    describe('Test addNewProperties option', () => {
        it('Doesn\'t add property to value with addNewProperties = false', async () => {
            // Update Item
            MY_COLLECTION.update(2, {name: 'updatedJamie2', age: 10}, {addNewProperties: false});

            // Needs some time to call callbackFunction
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(JSON.stringify(MY_COLLECTION.data[2]?.value)).to.eq(JSON.stringify({
                id: 2,
                name: 'updatedJamie2'
            }), 'MY_COLLECTION data at id 2 has updated');
            expect(Object.keys(MY_COLLECTION.data).length).to.eq(3, 'MY_COLLECTION has still all items')

            expect(rerenderCount).to.eq(5, 'rerenderCount has been increased by 1');
        });


        it('Does add property to value with addNewProperties = true', async () => {
            // Update Item
            MY_COLLECTION.update(2, {name: 'updatedJamie3', age: 20}, {addNewProperties: true});

            // Needs some time to call callbackFunction
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(JSON.stringify(MY_COLLECTION.data[2]?.value)).to.eq(JSON.stringify({
                id: 2,
                name: 'updatedJamie3',
                age: 20
            }), 'MY_COLLECTION data at id 2 has updated');
            expect(Object.keys(MY_COLLECTION.data).length).to.eq(3, 'MY_COLLECTION has still all items')

            expect(rerenderCount).to.eq(6, 'rerenderCount has been increased by 1');
        });
    });
});
