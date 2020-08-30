import 'mocha';
import {expect} from 'chai'
import Agile from "../../../src";

describe('Type Function Tests', () => {
    // Define Agile
    const App = new Agile();

    // Create State
    const MY_STATE = App.State(1).type(Number);

    it('Has correct initial values', () => {
        expect(MY_STATE.value).to.eq(1, 'MY_STATE has correct value');
        expect(typeof MY_STATE.value === 'number').to.eq(true, 'MY_STATE has correct type');
        expect(MY_STATE.valueType).to.eq('number', 'MY_STATE correct valueType');
    });

    describe('Test Type of State', () => {
        it('Can change State with correct Type', async () => {
            // Change State
            MY_STATE.set(2);

            expect(MY_STATE.value).to.eq(2, 'MY_STATE has correct value');
        });

        it('Can\'t change State with wrong Type', async () => {
            // Change State
            // @ts-ignore
            MY_STATE.set('Hello');

            expect(MY_STATE.value).to.eq(2, 'MY_STATE has correct value');
        });
    });
});
