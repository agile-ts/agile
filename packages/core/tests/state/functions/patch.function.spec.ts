import 'mocha';
import {expect} from 'chai';
import {Agile} from "../../../src";
import {useAgile_Test} from "../../test_integration";

describe('Patch Function Tests', () => {
    let rerenderCount = 0;
    let sideEffectCount = 0;

    // Define Agile
    const App = new Agile();

    // Object Interface
    interface userInterface {
        id: number,
        name: string
    }

    // Create State
    const MY_STATE = App.State<userInterface>({id: 1, name: 'jeff'});

    // Set sideEffects for testing the functionality of it
    MY_STATE.sideEffects = () => {
        sideEffectCount++
    };

    // Set 'Hook' for testing the rerenderFunctionality with the callbackFunction (Note: the value of myHookState doesn't get changed because no rerenders happen -> no reassign of the value)
    const [myHookState] = useAgile_Test([MY_STATE], () => {
        rerenderCount++;
    });

    it('Has correct initial values', () => {
        expect(JSON.stringify(MY_STATE.value)).to.eq(JSON.stringify({
            id: 1,
            name: 'jeff'
        }), 'MY_STATE has correct value');
        expect(MY_STATE.dep.subs.size === 1).to.eq(true, 'MY_STATE has correct subs size (Subs are components/callbackFunctions which causes rerender)');
        expect(typeof MY_STATE.sideEffects === 'function').to.eq(true, 'MY_STATE has sideEffect function');

        expect(JSON.stringify(myHookState)).to.eq(JSON.stringify({
            id: 1,
            name: 'jeff'
        }), 'myHookState has correct MY_STATE value');
        expect(rerenderCount).to.eq(0, 'rerenderCount is 0');
        expect(sideEffectCount).to.eq(0, 'sideEffectCount is 0');
    });

    describe('Patch State', () => {
        it('Can patch value into State', async () => {
            // Patch Value
            MY_STATE.patch({name: 'hans'});

            // Needs some time to call callbackFunction
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(JSON.stringify(MY_STATE.value)).to.eq(JSON.stringify({
                id: 1,
                name: 'hans'
            }), 'MY_STATE has correct value');
            expect(JSON.stringify(MY_STATE.previousState)).to.eq(JSON.stringify({
                id: 1,
                name: 'jeff'
            }), 'MY_STATE has correct previousState');
            expect(JSON.stringify(MY_STATE.nextState)).to.eq(JSON.stringify({
                id: 1,
                name: 'hans'
            }), 'MY_STATE has correct nextState');
            expect(MY_STATE.isSet).to.eq(true, 'MY_STATE has correct isSet');

            expect(sideEffectCount).to.eq(1, 'sideEffectCount has been increased by 1');
            expect(rerenderCount).to.eq(1, 'rerenderCount has been increased by 1');
        });

        it('Can\'t patch value into State if the value is the same', async () => {
            // Patch Value
            MY_STATE.patch({name: 'hans'});

            // Needs some time to call callbackFunction
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(JSON.stringify(MY_STATE.value)).to.eq(JSON.stringify({
                id: 1,
                name: 'hans'
            }), 'MY_STATE value stayed the same');
            expect(JSON.stringify(MY_STATE.previousState)).to.eq(JSON.stringify({
                id: 1,
                name: 'jeff'
            }), 'MY_STATE previousState stayed the same');
            expect(JSON.stringify(MY_STATE.nextState)).to.eq(JSON.stringify({
                id: 1,
                name: 'hans'
            }), 'MY_STATE nextState stayed the same');
            expect(MY_STATE.isSet).to.eq(true, 'MY_STATE isSet stayed the same');

            expect(sideEffectCount).to.eq(1, 'sideEffectCount hasn\'t been increased');
            expect(rerenderCount).to.eq(1, 'rerenderCount hasn\'t been increased');
        });

        it('Can\'t patch value into State which is no Object', async () => {
            // Patch State
            // @ts-ignore
            MY_STATE.patch('noObject');

            // Needs some time to call callbackFunction
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(JSON.stringify(MY_STATE.value)).to.eq(JSON.stringify({
                id: 1,
                name: 'hans'
            }), 'MY_STATE value stayed the same');
            expect(JSON.stringify(MY_STATE.previousState)).to.eq(JSON.stringify({
                id: 1,
                name: 'jeff'
            }), 'MY_STATE previousState stayed the same');
            expect(JSON.stringify(MY_STATE.nextState)).to.eq(JSON.stringify({
                id: 1,
                name: 'hans'
            }), 'MY_STATE nextState stayed the same');
            expect(MY_STATE.isSet).to.eq(true, 'MY_STATE isSet stayed the same');

            expect(sideEffectCount).to.eq(1, 'sideEffectCount hasn\'t been increased');
            expect(rerenderCount).to.eq(1, 'rerenderCount hasn\'t been increased');
        });

        it('Can\'t patch value into non Object State', async () => {
            // Create State
            const MY_NON_OBJECT_STATE = App.State<string>('test');

            // Patch State
            MY_NON_OBJECT_STATE.patch({test: 'test'});

            // Needs some time to call callbackFunction
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(MY_NON_OBJECT_STATE.value).to.eq('test', 'MY_NON_OBJECT_STATE value stayed the same');
            expect(MY_NON_OBJECT_STATE.previousState).to.eq('test', 'MY_NON_OBJECT_STATE previousState stayed the same');
            expect(MY_NON_OBJECT_STATE.nextState).to.eq('test', 'MY_NON_OBJECT_STATE nextState stayed the same');
            expect(MY_NON_OBJECT_STATE.isSet).to.eq(false, 'MY_NON_OBJECT_STATE isSet stayed the same');
        });
    });

    describe('Test addNewProperties option', () => {
        it('Doesn\'t add property to value with addNewProperties = false', async () => {
            // Patch State
            MY_STATE.patch({name: 'frank', age: 10}, {addNewProperties: false});

            // Needs some time to call callbackFunction
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(JSON.stringify(MY_STATE.value)).to.eq(JSON.stringify({
                id: 1,
                name: 'frank'
            }), 'MY_STATE has correct value');
            expect(JSON.stringify(MY_STATE.previousState)).to.eq(JSON.stringify({
                id: 1,
                name: 'hans'
            }), 'MY_STATE has correct previousState');
            expect(JSON.stringify(MY_STATE.nextState)).to.eq(JSON.stringify({
                id: 1,
                name: 'frank'
            }), 'MY_STATE has correct nextState');
            expect(MY_STATE.isSet).to.eq(true, 'MY_STATE has correct isSet');

            expect(sideEffectCount).to.eq(2, 'sideEffectCount has been increased by 1');
            expect(rerenderCount).to.eq(2, 'rerenderCount has been increased by 1');
        });

        it('Does add property to value with addNewProperties = true', async () => {
            // Patch State
            MY_STATE.patch({name: 'benno', age: 15}, {addNewProperties: true});

            // Needs some time to call callbackFunction
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(JSON.stringify(MY_STATE.value)).to.eq(JSON.stringify({
                id: 1,
                name: 'benno',
                age: 15
            }), 'MY_STATE has correct value');
            expect(JSON.stringify(MY_STATE.previousState)).to.eq(JSON.stringify({
                id: 1,
                name: 'frank'
            }), 'MY_STATE has correct previousState');
            expect(JSON.stringify(MY_STATE.nextState)).to.eq(JSON.stringify({
                id: 1,
                name: 'benno',
                age: 15
            }), 'MY_STATE has correct nextState');
            expect(MY_STATE.isSet).to.eq(true, 'MY_STATE has correct isSet');

            expect(sideEffectCount).to.eq(3, 'sideEffectCount has been increased by 1');
            expect(rerenderCount).to.eq(3, 'rerenderCount has been increased by 1');
        });
    });
});
