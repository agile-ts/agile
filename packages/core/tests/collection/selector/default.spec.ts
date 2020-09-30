import 'mocha';
import {expect} from "chai";
import {useAgile} from "../../../../react/tests";
import {Agile, Selector, Item} from "../../../src";

describe('Default Selector Tests', () => {
    // Define Agile
    const App = new Agile();

    describe('Selector', () => {
        let rerenderCount = 0;

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
        const [mySelector1] = useAgile([MY_COLLECTION.getSelector('selector1')], () => {
            rerenderCount++;
        });

        it('Has correct initial values', () => {
            expect(MY_COLLECTION.selectors['selector1'] instanceof Selector).to.eq(true, 'MY_COLLECTION selector1 Selector has been created');
            expect(MY_COLLECTION.selectors['selector1']?.dep.subs.size === 1).to.eq(true, 'MY_COLLECTION selector1 Selector has correct subs size');
            expect(MY_COLLECTION.selectors['selector1'].key).to.eq('selector1', 'selector1 Selector has correct initial key');
            expect(MY_COLLECTION.selectors['selector1'].id).to.eq(1, 'selector1 Selector has correct initial id');
            expect(MY_COLLECTION.selectors['selector1'].exists).to.eq(false, 'selector1 Selector doesn\'t exist');
            expect(JSON.stringify(MY_COLLECTION.selectors['selector1'].value)).to.eq(JSON.stringify(undefined), 'selector1 Selector has correct initial value');

            expect(MY_COLLECTION.data[1] instanceof Item).to.eq(true, 'MY_COLLECTION data at id 1 has been created');
            expect(MY_COLLECTION.data[1].exists).to.eq(false, 'MY_COLLECTION data at id 1 doesn\'t exist');
            expect(MY_COLLECTION.data[1].key).to.eq(1, 'MY_COLLECTION data at id 1 has correct initial key');
            expect(JSON.stringify(MY_COLLECTION.data[1].value)).to.eq(JSON.stringify({
                id: 1
            }), 'MY_COLLECTION data at id 1 has correct initial value');
            expect(JSON.stringify(MY_COLLECTION.data[1].initialState)).to.eq(JSON.stringify({
                id: 1
            }), 'MY_COLLECTION data at id 1 has correct initialState');
            expect(JSON.stringify(MY_COLLECTION.data[1].previousState)).to.eq(JSON.stringify({
                id: 1
            }), 'MY_COLLECTION data at id 1 has correct initialState');

            expect(JSON.stringify(mySelector1)).to.eq(JSON.stringify(undefined), 'mySelector1 has correct MY_COLLECTION selector1 value');
            expect(rerenderCount).to.eq(0, 'rerenderCount has correct value');
        });

        it('Has correct values after collecting items', async () => {
            // Collect Data
            MY_COLLECTION.collect([{id: 1, name: 'jeff'}, {id: 2, name: 'hans'}]);

            // Needs some time to call callbackFunction
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(MY_COLLECTION.selectors['selector1'].exists).to.eq(true, 'selector1 Selector exists');
            expect(JSON.stringify(MY_COLLECTION.selectors['selector1'].value)).to.eq(JSON.stringify({
                id: 1,
                name: 'jeff'
            }), 'selector1 Selector has correct initial value');

            expect(MY_COLLECTION.data[1].exists).to.eq(true, 'MY_COLLECTION data at id 1 exists');
            expect(JSON.stringify(MY_COLLECTION.data[1].value)).to.eq(JSON.stringify({
                id: 1,
                name: 'jeff'
            }), 'MY_COLLECTION data at id 1 has correct initial value');
            expect(JSON.stringify(MY_COLLECTION.data[1].initialState)).to.eq(JSON.stringify({
                id: 1,
                name: 'jeff'
            }), 'MY_COLLECTION data at id 1 has correct initialState');
            expect(JSON.stringify(MY_COLLECTION.data[1].previousState)).to.eq(JSON.stringify({
                id: 1,
                name: 'jeff'
            }), 'MY_COLLECTION data at id 1 has correct initialState');

            expect(rerenderCount).to.eq(1, 'rerenderCount has been increased by 1');
        });
    });

    describe('Selector with key', () => {
        // Object Interface
        interface userInterface {
            id: number
            name: string
        }

        // Create Collection
        const MY_COLLECTION = App.Collection<userInterface>(collection => ({
                selectors: {
                    selector1: collection.Selector(1, {key: 'mywierdselector'})
                }
            })
        );

        it('Has correct initial values', () => {
            expect(MY_COLLECTION.selectors['selector1'] instanceof Selector).to.eq(true, 'MY_COLLECTION selector1 Selector has been created');
            expect(MY_COLLECTION.selectors['selector1'].key).to.eq('mywierdselector', 'selector1 has correct key');
        });
    });
});
