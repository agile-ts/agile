import 'mocha';
import {expect} from 'chai';
import Agile from "../../../src";
import {useAgile} from "../../../src/integrations/test";

describe('Undo Function Tests', () => {
    let rerenderCount = 0;
    let sideEffectCount = 0;

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
    const MY_STATE = App.State<number>(1);

    // Set sideEffects for testing the functionality of it
    MY_STATE.sideEffects = () => {
        sideEffectCount++
    };

    // Set 'Hook' for testing the rerenderFunctionality with the callbackFunction (Note: the value of myHookState doesn't get changed because no rerenders happen -> no reassign of the value)
    const [myHookState] = useAgile([MY_STATE], () => {
        rerenderCount++;
    });

    it('Has correct initial values', () => {
        expect(MY_STATE.value).to.eq(1, 'MY_STATE has correct value');
        expect(MY_STATE.dep.subs.size === 1).to.eq(true, 'MY_STATE has correct subs size (Subs are components/callbackFunctions which causes rerender)');
        expect(typeof MY_STATE.sideEffects === 'function').to.eq(true, 'MY_STATE has sideEffect function');

        expect(myHookState).to.eq(1, 'myHookState has correct MY_STATE value');
        expect(rerenderCount).to.eq(0, 'rerenderCount is 0');
        expect(sideEffectCount).to.eq(0, 'sideEffectCount is 0');
    });

    it('Can undo State', async () => {
        // Change State
        MY_STATE.set(2);

        // Needs some time to call callbackFunction
        await new Promise(resolve => setTimeout(resolve, 100));

        // Change State
        MY_STATE.set(5);

        // Needs some time to call callbackFunction
        await new Promise(resolve => setTimeout(resolve, 100));

        // Undo State
        MY_STATE.undo();

        // Needs some time to call callbackFunction
        await new Promise(resolve => setTimeout(resolve, 100));

        expect(MY_STATE.value).to.eq(2, 'MY_STATE has correct value');
        expect(MY_STATE.previousState).to.eq(5, 'MY_STATE has correct previousState');
        expect(MY_STATE.nextState).to.eq(2, 'MY_STATE has correct nextState');
        expect(MY_STATE.isSet).to.eq(true, 'MY_STATE has correct isSet');

        expect(sideEffectCount).to.eq(3, 'sideEffectCount has been increased by 3 (2 by set, 1 by undo)');
        expect(rerenderCount).to.eq(3, 'rerenderCount has been increased by 3 (2 by set, 1 by undo)');
    });
});
