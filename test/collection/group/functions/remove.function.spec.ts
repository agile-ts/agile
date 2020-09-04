import Agile from "../../../../src";
import {useTest} from "../../../../src/integrations/test.integration";
import {expect} from "chai";
import {Group} from "../../../../src/collection/group";

describe('Add function Tests', () => {
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
        }
    });

    // Object Interface
    interface userInterface {
        id: number
        name: string
    }

    // Create Collection
    const MY_COLLECTION = App.Collection<userInterface>(collection => ({
            groups: {
                group1: collection.Group([1, 2, 3, 4, 5])
            }
        })
    );

    // Set 'Hook' for testing the rerenderFunctionality with the callbackFunction (Note: the value of myHookState doesn't get changed because no rerenders happen -> no reassign of the value)
    const [myGroup1] = useTest([MY_COLLECTION.getGroup('group1')], () => {
        rerenderCount++;
    });

    MY_COLLECTION.collect([
        {id: 1, name: 'jeff'},
        {id: 2, name: 'hans'},
        {id: 3, name: 'frank'},
        {id: 4, name: 'gina'},
        {id: 5, name: 'tabea'}
    ]);

    it('Has correct initial values', () => {
        expect(MY_COLLECTION.groups['group1'] instanceof Group).to.eq(true, 'MY_COLLECTION group1 Group has been created');
        expect(JSON.stringify(MY_COLLECTION.groups['group1'].value)).to.eq(JSON.stringify([1, 2, 3, 4, 5]), 'group1 has correct initial value');
        expect(JSON.stringify(MY_COLLECTION.groups['group1'].output)).to.eq(JSON.stringify([
            {id: 1, name: 'jeff'},
            {id: 2, name: 'hans'},
            {id: 3, name: 'frank'},
            {id: 4, name: 'gina'},
            {id: 5, name: 'tabea'}
        ]), 'group1 has correct output');

        expect(JSON.stringify(myGroup1)).to.eq(JSON.stringify([]), 'myGroup1 has correct MY_COLLECTION group1 value');
        expect(rerenderCount).to.eq(1, 'rerenderCount has correct value');
    });

    it('Can remove item which exists', async () => {
        MY_COLLECTION.groups['group1'].remove(1);

        // Needs some time to call callbackFunction
        await new Promise(resolve => setTimeout(resolve, 100));

        expect(JSON.stringify(MY_COLLECTION.groups['group1'].value)).to.eq(JSON.stringify([2, 3, 4, 5]), 'group1 has correct initial value');
        expect(JSON.stringify(MY_COLLECTION.groups['group1'].output)).to.eq(JSON.stringify([
            {id: 2, name: 'hans'},
            {id: 3, name: 'frank'},
            {id: 4, name: 'gina'},
            {id: 5, name: 'tabea'}
        ]), 'group1 has correct output');

        expect(rerenderCount).to.eq(2, 'rerenderCount has been increased by 1');
    });

    it('Can remove multiple items which exist', async () => {
        MY_COLLECTION.groups['group1'].remove([2, 3]);

        // Needs some time to call callbackFunction
        await new Promise(resolve => setTimeout(resolve, 100));

        expect(JSON.stringify(MY_COLLECTION.groups['group1'].value)).to.eq(JSON.stringify([4, 5]), 'group1 has correct initial value');
        expect(JSON.stringify(MY_COLLECTION.groups['group1'].output)).to.eq(JSON.stringify([
            {id: 4, name: 'gina'},
            {id: 5, name: 'tabea'}
        ]), 'group1 has correct output');

        expect(rerenderCount).to.eq(3, 'rerenderCount has been increased by 1');
    });

    it('Can\'t remove item which doesn\'t exist', async () => {
        MY_COLLECTION.groups['group1'].remove(100);

        // Needs some time to call callbackFunction
        await new Promise(resolve => setTimeout(resolve, 100));

        expect(JSON.stringify(MY_COLLECTION.groups['group1'].value)).to.eq(JSON.stringify([4, 5]), 'group1 has correct initial value');
        expect(JSON.stringify(MY_COLLECTION.groups['group1'].output)).to.eq(JSON.stringify([
            {id: 4, name: 'gina'},
            {id: 5, name: 'tabea'}
        ]), 'group1 has correct output');

        expect(rerenderCount).to.eq(3, 'rerenderCount stayed the same');
    });

    describe('Test background option', () => {
        it('Does call callBackFunction by removing Item from group with background = false', async () => {
            MY_COLLECTION.groups['group1'].remove(4, {background: false});

            // Needs some time to call callbackFunction
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(JSON.stringify(MY_COLLECTION.groups['group1'].value)).to.eq(JSON.stringify([5]), 'group1 has correct value');
            expect(JSON.stringify(MY_COLLECTION.groups['group1'].output)).to.eq(JSON.stringify([
                {id: 5, name: 'tabea'}
            ]), 'group1 has correct output');

            expect(rerenderCount).to.eq(4, 'rerenderCount has been increased by 1');
        });

        it('Doesn\'t call callBackFunction by removing Item from group with background = true', async () => {
            MY_COLLECTION.groups['group1'].remove(5, {background: true});

            // Needs some time to call callbackFunction
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(JSON.stringify(MY_COLLECTION.groups['group1'].value)).to.eq(JSON.stringify([]), 'group1 has correct value');
            expect(JSON.stringify(MY_COLLECTION.groups['group1'].output)).to.eq(JSON.stringify([]), 'group1 has correct output');

            expect(rerenderCount).to.eq(4, 'rerenderCount stayed the same');
        });
    });
});
