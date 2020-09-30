import 'mocha';
import {expect} from "chai";
import {useAgile} from "../../../../../react/tests";
import {Agile, Group} from "../../../../src";

describe('Add function Tests', () => {
    let rerenderCount = 0;

    // Define Agile
    const App = new Agile();

    // Object Interface
    interface userInterface {
        id: number
        name: string
    }

    // Create Collection
    const MY_COLLECTION = App.Collection<userInterface>(collection => ({
            groups: {
                group1: collection.Group([2])
            }
        })
    );

    // Set 'Hook' for testing the rerenderFunctionality with the callbackFunction (Note: the value of myHookState doesn't get changed because no rerenders happen -> no reassign of the value)
    const [myGroup1] = useAgile([MY_COLLECTION.getGroup('group1')], () => {
        rerenderCount++;
    });

    MY_COLLECTION.collect([
        {id: 1, name: 'jeff'},
        {id: 2, name: 'hans'},
        {id: 3, name: 'frank'},
        {id: 4, name: 'gina'},
        {id: 5, name: 'tabea'},
        {id: 6, name: 'livia'},
        {id: 7, name: 'joshi'},
        {id: 8, name: 'günter'}
    ]);

    it('Has correct initial values', () => {
        expect(MY_COLLECTION.groups['group1'] instanceof Group).to.eq(true, 'MY_COLLECTION group1 Group has been created');
        expect(JSON.stringify(MY_COLLECTION.groups['group1'].value)).to.eq(JSON.stringify([2]), 'group1 has correct initial value');
        expect(JSON.stringify(MY_COLLECTION.groups['group1'].output)).to.eq(JSON.stringify([
            {id: 2, name: 'hans'}
        ]), 'group1 has correct output');

        expect(JSON.stringify(myGroup1)).to.eq(JSON.stringify([]), 'myGroup1 has correct MY_COLLECTION group1 value');
        expect(rerenderCount).to.eq(1, 'rerenderCount has been correct value');
    });

    it('Can add Group', async () => {
        MY_COLLECTION.groups['group1'].add(1);

        // Needs some time to call callbackFunction
        await new Promise(resolve => setTimeout(resolve, 100));

        expect(JSON.stringify(MY_COLLECTION.groups['group1'].value)).to.eq(JSON.stringify([2, 1]), 'group1 has correct value');
        expect(JSON.stringify(MY_COLLECTION.groups['group1'].output)).to.eq(JSON.stringify([
            {id: 2, name: 'hans'},
            {id: 1, name: 'jeff'}
        ]), 'group1 has correct output');
        expect(JSON.stringify(MY_COLLECTION.groups['group1'].notFoundPrimaryKeys)).to.eq(JSON.stringify([]), 'group1 has correct notFoundPrimaryKeys');

        expect(rerenderCount).to.eq(2, 'rerenderCount has been increased by 1');
    });

    it('Can add multiple Groups', async () => {
        MY_COLLECTION.groups['group1'].add([7, 8]);

        // Needs some time to call callbackFunction
        await new Promise(resolve => setTimeout(resolve, 100));

        expect(JSON.stringify(MY_COLLECTION.groups['group1'].value)).to.eq(JSON.stringify([2, 1, 7, 8]), 'group1 has correct value');
        expect(JSON.stringify(MY_COLLECTION.groups['group1'].output)).to.eq(JSON.stringify([
            {id: 2, name: 'hans'},
            {id: 1, name: 'jeff'},
            {id: 7, name: 'joshi'},
            {id: 8, name: 'günter'}
        ]), 'group1 has correct output');
        expect(JSON.stringify(MY_COLLECTION.groups['group1'].notFoundPrimaryKeys)).to.eq(JSON.stringify([]), 'group1 has correct notFoundPrimaryKeys');

        expect(rerenderCount).to.eq(3, 'rerenderCount has been increased by 1');
    });

    it('Can\'t add item to Group which already exists', async () => {
        MY_COLLECTION.groups['group1'].add(1);

        // Needs some time to call callbackFunction
        await new Promise(resolve => setTimeout(resolve, 100));

        expect(JSON.stringify(MY_COLLECTION.groups['group1'].value)).to.eq(JSON.stringify([2, 1, 7, 8]), 'group1 has correct value');
        expect(JSON.stringify(MY_COLLECTION.groups['group1'].output)).to.eq(JSON.stringify([
            {id: 2, name: 'hans'},
            {id: 1, name: 'jeff'},
            {id: 7, name: 'joshi'},
            {id: 8, name: 'günter'}
        ]), 'group1 has correct output');

        expect(rerenderCount).to.eq(3, 'rerenderCount stayed the same');
    });

    it('Can add item to Group which doesn\'t exist in collection', async () => {
        MY_COLLECTION.groups['group1'].add(100);

        // Needs some time to call callbackFunction
        await new Promise(resolve => setTimeout(resolve, 100));

        expect(JSON.stringify(MY_COLLECTION.groups['group1'].value)).to.eq(JSON.stringify([2, 1, 7, 8, 100]), 'group1 has correct value');
        expect(JSON.stringify(MY_COLLECTION.groups['group1'].output)).to.eq(JSON.stringify([
            {id: 2, name: 'hans'},
            {id: 1, name: 'jeff'},
            {id: 7, name: 'joshi'},
            {id: 8, name: 'günter'}
        ]), 'group1 has correct output');
        expect(JSON.stringify(MY_COLLECTION.groups['group1'].notFoundPrimaryKeys)).to.eq(JSON.stringify([100]), 'group1 has correct notFoundPrimaryKeys');

        expect(rerenderCount).to.eq(3, 'rerenderCount stayed the same because output won\'t change -> rerender not necessary');
    });

    describe('Test background option', () => {
        it('Does call callBackFunction by adding Item to group with background = false', async () => {
            MY_COLLECTION.groups['group1'].add(3, {background: false});

            // Needs some time to call callbackFunction
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(JSON.stringify(MY_COLLECTION.groups['group1'].value)).to.eq(JSON.stringify([2, 1, 7, 8, 100, 3]), 'group1 has correct value');
            expect(JSON.stringify(MY_COLLECTION.groups['group1'].output)).to.eq(JSON.stringify([
                {id: 2, name: 'hans'},
                {id: 1, name: 'jeff'},
                {id: 7, name: 'joshi'},
                {id: 8, name: 'günter'},
                {id: 3, name: 'frank'}
            ]), 'group1 has correct output');

            expect(rerenderCount).to.eq(4, 'rerenderCount has been increased by 1');
        });

        it('Doesn\'t call callBackFunction by adding Item to group with background = true', async () => {
            MY_COLLECTION.groups['group1'].add(4, {background: true});

            // Needs some time to call callbackFunction
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(JSON.stringify(MY_COLLECTION.groups['group1'].value)).to.eq(JSON.stringify([2, 1, 7, 8, 100, 3, 4]), 'group1 has correct value');
            expect(JSON.stringify(MY_COLLECTION.groups['group1'].output)).to.eq(JSON.stringify([
                {id: 2, name: 'hans'},
                {id: 1, name: 'jeff'},
                {id: 7, name: 'joshi'},
                {id: 8, name: 'günter'},
                {id: 3, name: 'frank'},
                {id: 4, name: 'gina'}
            ]), 'group1 has correct output');

            expect(rerenderCount).to.eq(4, 'rerenderCount stayed the same');
        });
    });

    describe('Test method option', () => {
        it('Does add the item at the end of the group with method = \'push\'', async () => {
            MY_COLLECTION.groups['group1'].add(5, {method: 'push'});

            // Needs some time to call callbackFunction
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(JSON.stringify(MY_COLLECTION.groups['group1'].value)).to.eq(JSON.stringify([2, 1, 7, 8, 100, 3, 4, 5]), 'group1 has correct value');
            expect(JSON.stringify(MY_COLLECTION.groups['group1'].output)).to.eq(JSON.stringify([
                {id: 2, name: 'hans'},
                {id: 1, name: 'jeff'},
                {id: 7, name: 'joshi'},
                {id: 8, name: 'günter'},
                {id: 3, name: 'frank'},
                {id: 4, name: 'gina'},
                {id: 5, name: 'tabea'}
            ]), 'group1 has correct output');

            expect(rerenderCount).to.eq(5, 'rerenderCount has been increased by 1');
        });

        it('Does add the item at the start of the group with method = \'unshift\'', async () => {
            MY_COLLECTION.groups['group1'].add(6, {method: 'unshift'});

            // Needs some time to call callbackFunction
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(JSON.stringify(MY_COLLECTION.groups['group1'].value)).to.eq(JSON.stringify([6, 2, 1, 7, 8, 100, 3, 4, 5]), 'group1 has correct value');
            expect(JSON.stringify(MY_COLLECTION.groups['group1'].output)).to.eq(JSON.stringify([
                {id: 6, name: 'livia'},
                {id: 2, name: 'hans'},
                {id: 1, name: 'jeff'},
                {id: 7, name: 'joshi'},
                {id: 8, name: 'günter'},
                {id: 3, name: 'frank'},
                {id: 4, name: 'gina'},
                {id: 5, name: 'tabea'}
            ]), 'group1 has correct output');

            expect(rerenderCount).to.eq(6, 'rerenderCount has been increased by 1');
        });
    });

    describe('Test overwrite option', () => {
        it('Leave existing item at current position and doesn\'t overwrite it with overwrite = false', async () => {
            MY_COLLECTION.groups['group1'].add(3, {overwrite: false});

            // Needs some time to call callbackFunction
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(JSON.stringify(MY_COLLECTION.groups['group1'].value)).to.eq(JSON.stringify([6, 2, 1, 7, 8, 100, 3, 4, 5]), 'group1 has correct value');
            expect(JSON.stringify(MY_COLLECTION.groups['group1'].output)).to.eq(JSON.stringify([
                {id: 6, name: 'livia'},
                {id: 2, name: 'hans'},
                {id: 1, name: 'jeff'},
                {id: 7, name: 'joshi'},
                {id: 8, name: 'günter'},
                {id: 3, name: 'frank'},
                {id: 4, name: 'gina'},
                {id: 5, name: 'tabea'}
            ]), 'group1 has correct output');

            expect(rerenderCount).to.eq(6, 'rerenderCount stayed the same');
        });

        it('Overwrites existing item and add it at new position with overwrite = true', async () => {
            MY_COLLECTION.groups['group1'].add(3, {overwrite: true});

            // Needs some time to call callbackFunction
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(JSON.stringify(MY_COLLECTION.groups['group1'].value)).to.eq(JSON.stringify([6, 2, 1, 7, 8, 100, 4, 5, 3]), 'group1 has correct value');
            expect(JSON.stringify(MY_COLLECTION.groups['group1'].output)).to.eq(JSON.stringify([
                {id: 6, name: 'livia'},
                {id: 2, name: 'hans'},
                {id: 1, name: 'jeff'},
                {id: 7, name: 'joshi'},
                {id: 8, name: 'günter'},
                {id: 4, name: 'gina'},
                {id: 5, name: 'tabea'},
                {id: 3, name: 'frank'}
            ]), 'group1 has correct output');

            expect(rerenderCount).to.eq(7, 'rerenderCount has been increased by 1');
        });
    });
});
