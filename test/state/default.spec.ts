import 'mocha';
import {expect} from 'chai';
import Agile, {State} from "../../src";

describe('Default Tests', () => {
    // Define Agile
    const App = new Agile();

    // Set States
    const MY_STATE = App.State<string>('hello');
    const MY_STATE_WITH_KEY = App.State<boolean>(true, 'withKey');

    it('Has correct initial values', () => {
        expect(MY_STATE.value).to.eq('hello', 'MY_STATE has correct value');
        expect(typeof MY_STATE.value === 'string').to.eq(true, 'MY_STATE has correct type');
        expect(MY_STATE._value).to.eq('hello', 'MY_STATE has correct _value')
        expect(MY_STATE.previousState).to.eq('hello', 'MY_STATE has correct previousState');
        expect(MY_STATE.key).to.eq(undefined, 'MY_STATE has correct key');
        expect(MY_STATE._key).to.eq(undefined, 'My_STATE has correct _key');
        expect(MY_STATE.sideEffects).to.eq(undefined, 'MY_STATE has no sideEffects');
        expect(MY_STATE.nextState).to.eq('hello', 'MY_STATE has correct nextState');
        expect(MY_STATE.initialState).to.eq('hello', 'MY_STATE has correct initialState');
        expect(MY_STATE.exists).to.eq(true, 'MY_STATE has correct exists');
        expect(MY_STATE.isSet).to.eq(false, 'MY_STATE has correct isSet');
        expect(MY_STATE.persistSettings.isPersisted).to.eq(false, 'MY_STATE has correct isPersistState');
        expect(MY_STATE.isPlaceholder).to.eq(false, 'MY_STATE has correct isPlaceholder');
        expect(MY_STATE.valueType).to.eq(undefined, 'MY_STATE has correct valueType');
        expect(MY_STATE.exists).to.eq(true, 'MY_STATE exists');

        expect(typeof MY_STATE_WITH_KEY.value === 'boolean').to.eq(true, 'MY_STATE_WITH_KEY has correct type');
        expect(MY_STATE_WITH_KEY.key).to.eq('withKey', 'MY_STATE_WITH_KEY has correct key');
        expect(MY_STATE_WITH_KEY._key).to.eq('withKey', 'MY_STATE_WITH_KEY has correct _key');
    });

    it('Can change key', () => {
        // Update keys
        MY_STATE.key = 'withKey';
        MY_STATE_WITH_KEY.key = 'withNewKey';

        expect(MY_STATE.key).to.eq('withKey', 'MY_STATE has correct key');
        expect(MY_STATE._key).to.eq('withKey', 'My_STATE has correct _key');

        expect(MY_STATE_WITH_KEY.key).to.eq('withNewKey', 'MY_STATE_WITH_KEY has correct key');
        expect(MY_STATE_WITH_KEY._key).to.eq('withNewKey', 'MY_STATE_WITH_KEY has correct _key');
    });

    it('Can change value', () => {
        // Update values
        MY_STATE.value = 'bye';
        MY_STATE_WITH_KEY.value = false;

        expect(MY_STATE.value).to.eq('bye', 'MY_STATE has correct value');
        expect(MY_STATE._value).to.eq('bye', 'My_STATE has correct _value');

        expect(MY_STATE_WITH_KEY.value).to.eq(false, 'MY_STATE_WITH_KEY has correct value');
        expect(MY_STATE_WITH_KEY._value).to.eq(false, 'MY_STATE_WITH_KEY has correct _value');
    });
});
