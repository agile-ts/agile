import 'mocha';
import {expect} from 'chai';
import Agile from "../../../src";
import {useTest} from "../../../src/integrations/test.integration";

describe('Set Function Tests', () => {
    let rerenderCount = 0;
    let sideEffectCount = 0;
    const App = new Agile({
        framework: {
            name: 'test', // The name of the framework
            bind: (agileInstance: Agile) => {
            },
            updateMethod: (componentInstance: any, updatedData: Object) => {
            }
        },
    });

    interface userInterface {
        id: number,
        name: string
    }

    const MY_STATE = App.State<userInterface>({id: 1, name: 'jeff'}, 'myState');
    MY_STATE.sideEffects = () => {
        sideEffectCount++
    };

    // Note doesn't get updated because it doesn't 'rerender'
    const [myHookState] = useTest([MY_STATE], () => {
        console.log("Called Callback");
        rerenderCount++;
    });

    it('Has correct default values', () => {
        expect(JSON.stringify(MY_STATE.value)).to.eq(JSON.stringify({id: 1, name: 'jeff'}));
        expect(JSON.stringify(MY_STATE.previousState)).to.eq(JSON.stringify({id: 1, name: 'jeff'}));
        expect(JSON.stringify(MY_STATE.nextState)).to.eq(JSON.stringify({id: 1, name: 'jeff'}));
        expect(MY_STATE.dep.subs.size === 1).to.eq(true);
        expect(typeof MY_STATE.sideEffects === 'function').to.eq(true);

        expect(JSON.stringify(myHookState)).to.eq(JSON.stringify({id: 1, name: 'jeff'}));
    });

    describe('Update State', () => {
        it('Has correct values', async () => {
            MY_STATE.set({id: 2, name: 'hans'});

            // Needs some time to call callbackFunction
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(JSON.stringify(MY_STATE.value)).to.eq(JSON.stringify({id: 2, name: 'hans'}));
            expect(JSON.stringify(MY_STATE.previousState)).to.eq(JSON.stringify({id: 1, name: 'jeff'}));
            expect(JSON.stringify(MY_STATE.nextState)).to.eq(JSON.stringify({id: 2, name: 'hans'}));
            expect(MY_STATE.isSet).to.eq(true);

            expect(sideEffectCount).to.eq(1);
            expect(rerenderCount).to.eq(1);
        });
    });

    describe('Test sideEffects', () => {
        it('Executes SideEffect if set to true', async () => {
            MY_STATE.set({id: 3, name: 'benno'}, {sideEffects: true});

            // Needs some time to call callbackFunction
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(sideEffectCount).to.eq(2);
            expect(rerenderCount).to.eq(2);
        });

        it('Doesn\'t Execute SideEffect if set to false', async () => {
            MY_STATE.set({id: 3, name: 'benno'}, {sideEffects: false});

            // Needs some time to call callbackFunction
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(sideEffectCount).to.eq(2);
            expect(rerenderCount).to.eq(2, 'Because of same value it shouldn\'t cause a rerender');
        });
    });
});
