import 'mocha';
import {expect} from "chai";
import {Agile, Selector, Item} from "../../../../src";
import {useAgile_Test} from "../../../test_integration";

describe('select Function Tests', () => {
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
            selectors: {
                selector1: collection.Selector(1)
            }
        })
    );

    // Set 'Hook' for testing the rerenderFunctionality with the callbackFunction (Note: the value of myHookState doesn't get changed because no rerenders happen -> no reassign of the value)
    const [mySelector1] = useAgile_Test([MY_COLLECTION.getSelector('selector1')], () => {
        rerenderCount++;
    });

    MY_COLLECTION.collect([{id: 1, name: 'jeff'}, {id: 2, name: 'hans'}]);

    it('Has initial value', () => {
        expect(MY_COLLECTION.selectors['selector1'] instanceof Selector).to.eq(true, 'selector1 Selector exists');
        expect(MY_COLLECTION.selectors['selector1'].id).to.eq(1, 'selector1 Selector is watching correct id');
        expect(JSON.stringify(MY_COLLECTION.selectors['selector1'].value)).to.eq(JSON.stringify({
            id: 1,
            name: 'jeff'
        }), 'selector1 Selector has correct initial value');

        expect(JSON.stringify(MY_COLLECTION.data[1].value)).to.eq(JSON.stringify({
            id: 1,
            name: 'jeff'
        }), 'MY_COLLECTION at id 1 has correct data');
        expect(JSON.stringify(MY_COLLECTION.data[2].value)).to.eq(JSON.stringify({
            id: 2,
            name: 'hans'
        }), 'MY_COLLECTION at id 2 has correct data');

        expect(JSON.stringify(mySelector1)).to.eq(JSON.stringify(undefined), 'mySelector1 has correct MY_COLLECTION selector1 value');
        expect(rerenderCount).to.eq(1, 'rerenderCount has correct value');
    });

    it('Can select another id which doesn\'t exist', async () => {
        MY_COLLECTION.selectors['selector1'].select(100);

        // Needs some time to call callbackFunction
        await new Promise(resolve => setTimeout(resolve, 100));

        expect(MY_COLLECTION.selectors['selector1'].id).to.eq(100, 'selector1 Selector is watching correct id');
        expect(JSON.stringify(MY_COLLECTION.selectors['selector1'].value)).to.eq(JSON.stringify(undefined), 'selector1 Selector has correct value');

        expect(MY_COLLECTION.data[100] instanceof Item).to.eq(true, 'MY_COLLECTION at id 100 has been created as placeholder.. to hold connection');
        expect(JSON.stringify(MY_COLLECTION.data[100].value)).to.eq(JSON.stringify({
            id: 100,
        }), 'MY_COLLECTION at id 100 has correct value');
        expect(MY_COLLECTION.data[100].exists).to.eq(false, 'MY_COLLECTION at id 100 doesn\'t exist');

        expect(rerenderCount).to.eq(2, 'rerenderCount has been increased by 1');
    });

    it('Can select another id', async () => {
        MY_COLLECTION.selectors['selector1'].select(2);

        // Needs some time to call callbackFunction
        await new Promise(resolve => setTimeout(resolve, 100));

        expect(MY_COLLECTION.selectors['selector1'].id).to.eq(2, 'selector1 Selector is watching correct id');
        expect(JSON.stringify(MY_COLLECTION.selectors['selector1'].value)).to.eq(JSON.stringify({
            id: 2,
            name: 'hans'
        }), 'selector1 Selector has correct value');

        expect(MY_COLLECTION.data[100] instanceof Item).to.eq(false, 'MY_COLLECTION at id 100 has been removed');

        expect(rerenderCount).to.eq(3, 'rerenderCount has been increased by 1');
    });

    it('Can\'t select the same id', async () => {
        MY_COLLECTION.selectors['selector1'].select(2);

        // Needs some time to call callbackFunction
        await new Promise(resolve => setTimeout(resolve, 100));

        expect(MY_COLLECTION.selectors['selector1'].id).to.eq(2, 'selector1 Selector is watching correct id');
        expect(JSON.stringify(MY_COLLECTION.selectors['selector1'].value)).to.eq(JSON.stringify({
            id: 2,
            name: 'hans'
        }), 'selector1 Selector has correct value');

        expect(MY_COLLECTION.data[100] instanceof Item).to.eq(false, 'MY_COLLECTION at id 100 has been removed');

        expect(rerenderCount).to.eq(3, 'rerenderCount stayed the same');
    });

    describe('Test background option', () => {
        it('Does call callBackFunction by selecting new id with background = false', async () => {
            MY_COLLECTION.selectors['selector1'].select(1, {background: false});

            // Needs some time to call callbackFunction
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(MY_COLLECTION.selectors['selector1'].id).to.eq(1, 'selector1 Selector is watching correct id');
            expect(JSON.stringify(MY_COLLECTION.selectors['selector1'].value)).to.eq(JSON.stringify({
                id: 1,
                name: 'jeff'
            }), 'selector1 Selector has correct value');

            expect(rerenderCount).to.eq(4, 'rerenderCount has been increased by 1');
        });

        it('Doesn\'t call callBackFunction by selecting new id with background = true', async () => {
            MY_COLLECTION.selectors['selector1'].select(2, {background: true});

            // Needs some time to call callbackFunction
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(MY_COLLECTION.selectors['selector1'].id).to.eq(2, 'selector1 Selector is watching correct id');
            expect(JSON.stringify(MY_COLLECTION.selectors['selector1'].value)).to.eq(JSON.stringify({
                id: 2,
                name: 'hans'
            }), 'selector1 Selector has correct value');

            expect(rerenderCount).to.eq(4, 'rerenderCount stayed the same');
        });
    });
});
