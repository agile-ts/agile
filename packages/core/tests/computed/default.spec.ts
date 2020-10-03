import 'mocha';
import {expect} from 'chai';
import {Agile, Computed} from "../../src";
import {useAgile_Test} from "../test_integration";

describe('Default Computed Tests', () => {
    // Define Agile
    const App = new Agile();

    interface userInterface {
        id: number
        name: string
    }

    describe('Computed', () => {
        let computedCallCount = 0;
        let rerenderCount = 0;

        // Create State
        const MY_STATE = App.State<string>('hello');
        const MY_STATE_2 = App.State<string>('bye');

        // Create Collection
        const MY_COLLECTION = App.Collection<userInterface>({
            groups: ['group1', 'group2'],
            selectors: ['selector1', 'selector2']
        });

        // Create Selectors
        const MY_SELECTOR = MY_COLLECTION.getSelector('selector1')?.select(1);

        MY_COLLECTION.collect([{id: 1, name: 'jeff'}, {id: 2, name: 'hans'}]);

        // Create Computed
        const MY_COMPUTED = App.Computed<string>(() => {
            computedCallCount++;
            return `${MY_STATE.value}_${MY_STATE_2.value}_${MY_SELECTOR?.value?.name}_${MY_COLLECTION.findById(2)?.value.name}`
        });

        // Set 'Hook' for testing the rerenderFunctionality with the callbackFunction (Note: the value of myHookState doesn't get changed because no rerenders happen -> no reassign of the value)
        const [myComputed] = useAgile_Test([MY_COMPUTED], () => {
            rerenderCount++;
        });

        it('Has correct initial values', () => {
            expect(MY_COMPUTED instanceof Computed).to.eq(true, 'MY_COMPUTED is computed');
            expect(MY_COMPUTED.key).to.eq(undefined, 'MY_COMPUTED has correct initial key');
            expect(MY_COMPUTED.value).to.eq('hello_bye_jeff_hans', 'MY_COMPUTED has correct value');
            expect(JSON.stringify(MY_COMPUTED.hardCodedDeps)).to.eq(JSON.stringify([]), 'MY_COMPUTED has correct hardCodedDeps');
            expect(JSON.stringify(MY_COMPUTED.deps)).to.eq(JSON.stringify([MY_STATE, MY_STATE_2, MY_SELECTOR, MY_COLLECTION.findById(2)]), 'MY_COMPUTED has correct deps');
            expect(computedCallCount).to.eq(2, 'computedCallCount has correct initial value');
            expect(rerenderCount).to.eq(0, 'rerenderCount has correct initial value');
        });

        it('Does call computed Function if updating item', async () => {
            // Update State
            MY_STATE_2.set('hehe');

            // Needs some time to call computed
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(MY_COMPUTED.value).to.eq('hello_hehe_jeff_hans', 'MY_COMPUTED has correct value');
            expect(computedCallCount).to.eq(3, 'computedCallCount has been increased by 1');
            expect(rerenderCount).to.eq(1, 'rerenderCount has been increased by 1');

            // Update Collection
            MY_COLLECTION.update(2, {name: 'test'})

            // Needs some time to call computed
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(MY_COMPUTED.value).to.eq('hello_hehe_jeff_test', 'MY_COMPUTED has correct value');
            expect(computedCallCount).to.eq(4, 'computedCallCount has been increased by 1');
            expect(rerenderCount).to.eq(2, 'rerenderCount has been increased by 1');

            // Update Collection
            MY_COLLECTION.update(1, {name: 'fun'})

            // Needs some time to call computed
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(MY_COMPUTED.value).to.eq('hello_hehe_fun_test', 'MY_COMPUTED has correct value');
            expect(computedCallCount).to.eq(5, 'computedCallCount has been increased by 1');
            expect(rerenderCount).to.eq(3, 'rerenderCount has been increased by 1');
        });
    });

    describe('Computed with initial subs', () => {
        let computedCallCount = 0;
        let rerenderCount = 0;

        // Create State
        const MY_STATE = App.State<string>('hello');
        const MY_STATE_2 = App.State<string>('bye');
        const MY_STATE_3 = App.State<string>('test');

        // Create Collection
        const MY_COLLECTION = App.Collection<userInterface>({
            groups: ['group1', 'group2'],
            selectors: ['selector1', 'selector2']
        });

        // Create Selectors
        const MY_SELECTOR = MY_COLLECTION.getSelector('selector1')?.select(1);

        MY_COLLECTION.collect([{id: 1, name: 'jeff'}, {id: 2, name: 'hans'}]);

        // Create Computed
        const MY_COMPUTED = App.Computed<string>(() => {
            computedCallCount++;
            return `${MY_STATE.value}_${MY_STATE_2.value}_${MY_SELECTOR?.value?.name}_${MY_COLLECTION.findById(2)?.value.name}`
        }, [MY_STATE_3]);

        // Set 'Hook' for testing the rerenderFunctionality with the callbackFunction (Note: the value of myHookState doesn't get changed because no rerenders happen -> no reassign of the value)
        const [myComputed] = useAgile_Test([MY_COMPUTED], () => {
            rerenderCount++;
        });

        it('Has correct initial values', () => {
            expect(MY_COMPUTED instanceof Computed).to.eq(true, 'MY_COMPUTED is computed');
            expect(MY_COMPUTED.key).to.eq(undefined, 'MY_COMPUTED has correct initial key');
            expect(MY_COMPUTED.value).to.eq('hello_bye_jeff_hans', 'MY_COMPUTED has correct value');
            expect(JSON.stringify(MY_COMPUTED.hardCodedDeps)).to.eq(JSON.stringify([MY_STATE_3]), 'MY_COMPUTED has correct hardCodedDeps');
            expect(JSON.stringify(MY_COMPUTED.deps)).to.eq(JSON.stringify([MY_STATE_3, MY_STATE, MY_STATE_2, MY_SELECTOR, MY_COLLECTION.findById(2)]), 'MY_COMPUTED has correct deps');
            expect(computedCallCount).to.eq(2, 'computedCallCount has correct initial value');
            expect(rerenderCount).to.eq(0, 'rerenderCount has correct initial value');
        });

        it('Does call computed Function if updating item', async () => {
            // Update State
            MY_STATE_3.set('changed');

            // Needs some time to call computed
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(MY_STATE_3.value).to.eq('changed', 'MY_STATE_3 has correct value')
            expect(MY_COMPUTED.value).to.eq('hello_bye_jeff_hans', 'MY_COMPUTED has correct value');
            expect(computedCallCount).to.eq(3, 'computedCallCount has been increased by 1');
            expect(rerenderCount).to.eq(0, 'rerenderCount stayed the same because computed hasn\'t changed');
        });
    });
});
