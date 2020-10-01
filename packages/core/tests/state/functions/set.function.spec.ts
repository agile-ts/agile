import 'mocha';
import {expect} from 'chai';
import {Agile} from "../../../src";
import {useAgile_Test} from "../../../../react/tests";

describe('Set Function Tests', () => {
    let rerenderCount = 0;
    let sideEffectCount = 0;

    // Define Agile
    const App = new Agile();

    // Create State
    const MY_STATE = App.State<number>(1);

    // Set sideEffects for testing the functionality of it
    MY_STATE.sideEffects = () => {
        sideEffectCount++
    };

    // Set 'Hook' for testing the rerenderFunctionality with the callbackFunction (Note: the value of myHookState doesn't get changed because no rerenders happen -> no reassign of the value)
    const [myHookState] = useAgile_Test([MY_STATE], () => {
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

    it('Can change State', async () => {
        // Change State
        MY_STATE.set(2);

        // Needs some time to call callbackFunction
        await new Promise(resolve => setTimeout(resolve, 100));

        expect(MY_STATE.value).to.eq(2, 'MY_STATE has correct value');
        expect(MY_STATE.previousState).to.eq(1, 'MY_STATE has correct previousState');
        expect(MY_STATE.nextState).to.eq(2, 'MY_STATE has correct nextState');
        expect(MY_STATE.isSet).to.eq(true, 'MY_STATE has correct isSet');
        expect(MY_STATE.exists).to.eq(true, 'MY_STATE exists');

        expect(sideEffectCount).to.eq(1, 'sideEffectCount has been increased by 1');
        expect(rerenderCount).to.eq(1, 'rerenderCount has been increased by 1');
    });

    it('Can\'t change State with the same value', async () => {
        // Change State
        MY_STATE.set(2);

        // Needs some time to call callbackFunction
        await new Promise(resolve => setTimeout(resolve, 100));

        expect(MY_STATE.value).to.eq(2, 'MY_STATE has correct value');
        expect(MY_STATE.previousState).to.eq(1, 'MY_STATE has correct previousState');
        expect(MY_STATE.nextState).to.eq(2, 'MY_STATE has correct nextState');
        expect(MY_STATE.isSet).to.eq(true, 'MY_STATE has correct isSet');

        expect(sideEffectCount).to.eq(1, 'sideEffectCount hasn\'t been increased');
        expect(rerenderCount).to.eq(1, 'rerenderCount hasn\'t been increased');
    });

    describe('Test sideEffects option', () => {
        it('Does call sideEffects by changing State with sideEffects = true', async () => {
            // Change State
            MY_STATE.set(3, {sideEffects: true});

            // Needs some time to call callbackFunction
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(sideEffectCount).to.eq(2, 'sideEffectCount has been increased by 1');
            expect(rerenderCount).to.eq(2, 'rerenderCount has been increased by 1');
        });

        it('Doesn\'t call sideEffects by changing State with sideEffects = false', async () => {
            // Change State
            MY_STATE.set(4, {sideEffects: false});

            // Needs some time to call callbackFunction
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(sideEffectCount).to.eq(2, 'sideEffectCount hasn\'t been increased');
            expect(rerenderCount).to.eq(3, 'rerenderCount has been increased by 1');
        });
    });

    describe('Test background option', () => {
        it('Doesn\'t call callBackFunction by changing State with background = true', async () => {
            // Change State
            MY_STATE.set(5, {background: true});

            // Needs some time to call callbackFunction
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(sideEffectCount).to.eq(3, 'sideEffectCount has been increased by 1');
            expect(rerenderCount).to.eq(3, 'rerenderCount hasn\'t been increased');
        });

        it('Does call callBackFunction by changing State with background = false', async () => {
            // Change State
            MY_STATE.set(6, {background: false});

            // Needs some time to call callbackFunction
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(sideEffectCount).to.eq(4, 'sideEffectCount has been increased by 1');
            expect(rerenderCount).to.eq(4, 'rerenderCount has been increased by 1');
        });
    });
});
