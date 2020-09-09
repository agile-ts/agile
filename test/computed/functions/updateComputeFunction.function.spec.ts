import 'mocha';
import {expect} from 'chai';
import Agile from "../../../src";
import Computed from "../../../src/computed";
import {useTest} from "../../../src/integrations/test.integration";

describe('updateComputeFunction Function tests', () => {
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

    // Create State
    const MY_STATE = App.State<string>('hello');
    const MY_STATE_2 = App.State<string>('bye');
    const MY_STATE_3 = App.State<string>('jeff');
    const MY_STATE_4 = App.State<string>('hans');

    // Create Computed
    const MY_COMPUTED = App.Computed<string>(() => {
        return `${MY_STATE.value}_${MY_STATE_2.value}`
    });

    // Set 'Hook' for testing the rerenderFunctionality with the callbackFunction (Note: the value of myHookState doesn't get changed because no rerenders happen -> no reassign of the value)
    const [myComputed] = useTest([MY_COMPUTED], () => {
        rerenderCount++;
    });

    it('Has correct initial values', () => {
        expect(MY_COMPUTED instanceof Computed).to.eq(true, 'MY_COMPUTED is computed');
        expect(MY_COMPUTED.key).to.eq(undefined, 'MY_COMPUTED has correct initial key');
        expect(MY_COMPUTED.value).to.eq('hello_bye', 'MY_COMPUTED has correct value');
        expect(JSON.stringify(MY_COMPUTED.hardCodedDeps)).to.eq(JSON.stringify([]), 'MY_COMPUTED has correct hardCodedDeps');
        expect(JSON.stringify(MY_COMPUTED.deps)).to.eq(JSON.stringify([MY_STATE, MY_STATE_2]), 'MY_COMPUTED has correct deps');

        expect(myComputed).to.eq('hello_bye', 'myComputed has correct initial value');
        expect(rerenderCount).to.eq(0, 'rerenderCount has correct initial value');
    });

    it('Can update compute Function', async () => {
        // Update compute Function
        MY_COMPUTED.updateComputeFunction(() => {
            return `${MY_STATE_3.value}_${MY_STATE_4.value}`
        });

        // Needs some time to call computed
        await new Promise(resolve => setTimeout(resolve, 100));

        expect(MY_COMPUTED.value).to.eq('jeff_hans', 'MY_COMPUTED has correct value');
        expect(JSON.stringify(MY_COMPUTED.hardCodedDeps)).to.eq(JSON.stringify([]), 'MY_COMPUTED has correct hardCodedDeps');
        expect(JSON.stringify(MY_COMPUTED.deps)).to.eq(JSON.stringify([MY_STATE_3, MY_STATE_4]), 'MY_COMPUTED has correct deps');

        expect(rerenderCount).to.eq(1, 'rerenderCount has been increased by 1');
    });

    it('Can update compute Function with hardCodedDeps', async () => {
        // Update compute Function
        MY_COMPUTED.updateComputeFunction(() => {
            return `${MY_STATE_2.value}_${MY_STATE_3.value}`
        }, [MY_STATE_4]);

        // Needs some time to call computed
        await new Promise(resolve => setTimeout(resolve, 100));

        expect(MY_COMPUTED.value).to.eq('bye_jeff', 'MY_COMPUTED has correct value');
        expect(JSON.stringify(MY_COMPUTED.hardCodedDeps)).to.eq(JSON.stringify([MY_STATE_4]), 'MY_COMPUTED has correct hardCodedDeps');
        expect(JSON.stringify(MY_COMPUTED.deps)).to.eq(JSON.stringify([MY_STATE_4, MY_STATE_2, MY_STATE_3]), 'MY_COMPUTED has correct deps');

        expect(rerenderCount).to.eq(2, 'rerenderCount has been increased by 1');
    });

    it('Can\'t update compute Function with the same value', async () => {
        // Update compute Function
        MY_COMPUTED.updateComputeFunction(() => {
            return `${MY_STATE_2.value}_${MY_STATE_3.value}`
        }, []);

        // Needs some time to call computed
        await new Promise(resolve => setTimeout(resolve, 100));

        expect(MY_COMPUTED.value).to.eq('bye_jeff', 'MY_COMPUTED has correct value');
        expect(JSON.stringify(MY_COMPUTED.hardCodedDeps)).to.eq(JSON.stringify([]), 'MY_COMPUTED has correct hardCodedDeps');
        expect(JSON.stringify(MY_COMPUTED.deps)).to.eq(JSON.stringify([MY_STATE_2, MY_STATE_3]), 'MY_COMPUTED has correct deps');

        expect(rerenderCount).to.eq(2, 'rerenderCount stayed the same');
    });

    describe('Test background option', () => {
        it('Does call callBackFunction by updating computeFunction with background = false', async () => {
            // Update compute Function
            MY_COMPUTED.updateComputeFunction(() => {
                return `${MY_STATE.value}_${MY_STATE_3.value}`
            }, [], {background: false});

            // Needs some time to call computed
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(MY_COMPUTED.value).to.eq('hello_jeff', 'MY_COMPUTED has correct value');
            expect(JSON.stringify(MY_COMPUTED.hardCodedDeps)).to.eq(JSON.stringify([]), 'MY_COMPUTED has correct hardCodedDeps');
            expect(JSON.stringify(MY_COMPUTED.deps)).to.eq(JSON.stringify([MY_STATE, MY_STATE_3]), 'MY_COMPUTED has correct deps');

            expect(rerenderCount).to.eq(3, 'rerenderCount has been increased by 1');
        });

        it('Doesn\'t call callBackFunction by updating computeFunction with background = true', async () => {
            // Update compute Function
            MY_COMPUTED.updateComputeFunction(() => {
                return `${MY_STATE_4.value}_${MY_STATE_2.value}`
            }, [], {background: true});

            // Needs some time to call computed
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(MY_COMPUTED.value).to.eq('hans_bye', 'MY_COMPUTED has correct value');
            expect(JSON.stringify(MY_COMPUTED.hardCodedDeps)).to.eq(JSON.stringify([]), 'MY_COMPUTED has correct hardCodedDeps');
            expect(JSON.stringify(MY_COMPUTED.deps)).to.eq(JSON.stringify([MY_STATE_4, MY_STATE_2]), 'MY_COMPUTED has correct deps');

            expect(rerenderCount).to.eq(3, 'rerenderCount stayed the same');
        });
    });
});
