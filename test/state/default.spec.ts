import 'mocha';
import {expect} from 'chai';
import Agile, {State} from "../../src";

describe('Default Tests', () => {
    const App = new Agile();

    // Set States
    const MY_BOOLEAN = App.State<boolean>(true);
    const MY_STRING = App.State<string>('hello');
    const MY_NUMBER = App.State<number>(10);
    const MY_OBJECT = App.State<{ name: string }>({name: 'jeff'});

    // Set States with Key
    const MY_BOOLEAN_WITH_KEY = App.State<boolean>(true, 'boolean');
    const MY_STRING_WITH_KEY = App.State<string>('hello', 'string');
    const MY_NUMBER_WITH_KEY = App.State<number>(10, 'number');
    const MY_OBJECT_WITH_KEY = App.State<{ name: string }>({name: 'jeff'}, 'object');

    it('Is State', () => {
        expect(MY_BOOLEAN instanceof State).to.eq(true);
        expect(MY_STRING instanceof State).to.eq(true);
        expect(MY_NUMBER instanceof State).to.eq(true);
        expect(MY_OBJECT instanceof State).to.eq(true);

        expect(MY_BOOLEAN_WITH_KEY instanceof State).to.eq(true);
        expect(MY_STRING_WITH_KEY instanceof State).to.eq(true);
        expect(MY_NUMBER_WITH_KEY instanceof State).to.eq(true);
        expect(MY_OBJECT_WITH_KEY instanceof State).to.eq(true);
    });

    it('Has correct initial Value', () => {
        expect(MY_BOOLEAN.value).to.eq(true);
        expect(MY_STRING.value).to.eq('hello');
        expect(MY_NUMBER.value).to.eq(10);
        expect(MY_OBJECT.value.name).to.eq('jeff');

        expect(MY_BOOLEAN_WITH_KEY.value).to.eq(true);
        expect(MY_STRING_WITH_KEY.value).to.eq('hello');
        expect(MY_NUMBER_WITH_KEY.value).to.eq(10);
        expect(MY_OBJECT_WITH_KEY.value.name).to.eq('jeff');
    });

    it('Has correct types', () => {
        expect(typeof MY_BOOLEAN.value === 'boolean').to.eq(true);
        expect(typeof MY_STRING.value === 'string').to.eq(true);
        expect(typeof MY_NUMBER.value === 'number').to.eq(true);
        expect(typeof MY_OBJECT.value === 'object').to.eq(true);

        expect(typeof MY_BOOLEAN_WITH_KEY.value === 'boolean').to.eq(true);
        expect(typeof MY_STRING_WITH_KEY.value === 'string').to.eq(true);
        expect(typeof MY_NUMBER_WITH_KEY.value === 'number').to.eq(true);
        expect(typeof MY_OBJECT_WITH_KEY.value === 'object').to.eq(true);
    });

    it('Has correct key', () => {
        expect(MY_BOOLEAN.key).to.eq(undefined);
        expect(MY_STRING.key).to.eq(undefined);
        expect(MY_NUMBER.key).to.eq(undefined);
        expect(MY_OBJECT.key).to.eq(undefined);

        expect(MY_BOOLEAN_WITH_KEY.key).to.eq('boolean');
        expect(MY_STRING_WITH_KEY.key).to.eq('string');
        expect(MY_NUMBER_WITH_KEY.key).to.eq('number');
        expect(MY_OBJECT_WITH_KEY.key).to.eq('object');
    });

    it('Has correct nextState', () => {
        expect(MY_BOOLEAN.nextState).to.eq(true);
        expect(MY_STRING.nextState).to.eq('hello');
        expect(MY_NUMBER.nextState).to.eq(10);
        expect(MY_OBJECT.nextState.name).to.eq('jeff');

        expect(MY_BOOLEAN_WITH_KEY.nextState).to.eq(true);
        expect(MY_STRING_WITH_KEY.nextState).to.eq('hello');
        expect(MY_NUMBER_WITH_KEY.nextState).to.eq(10);
        expect(MY_OBJECT_WITH_KEY.nextState.name).to.eq('jeff');
    });

    it('Has correct valueType', () => {
        expect(MY_BOOLEAN.valueType).to.eq(undefined);
        expect(MY_STRING.valueType).to.eq(undefined);
        expect(MY_NUMBER.valueType).to.eq(undefined);
        expect(MY_OBJECT.valueType).to.eq(undefined);

        expect(MY_BOOLEAN_WITH_KEY.valueType).to.eq(undefined);
        expect(MY_STRING_WITH_KEY.valueType).to.eq(undefined);
        expect(MY_NUMBER_WITH_KEY.valueType).to.eq(undefined);
        expect(MY_OBJECT_WITH_KEY.valueType).to.eq(undefined);
    });

    it('Has correct previousState', () => {
        expect(MY_BOOLEAN.previousState).to.eq(true);
        expect(MY_STRING.previousState).to.eq('hello');
        expect(MY_NUMBER.previousState).to.eq(10);
        expect(MY_OBJECT.previousState.name).to.eq('jeff');

        expect(MY_BOOLEAN_WITH_KEY.previousState).to.eq(true);
        expect(MY_STRING_WITH_KEY.previousState).to.eq('hello');
        expect(MY_NUMBER_WITH_KEY.previousState).to.eq(10);
        expect(MY_OBJECT_WITH_KEY.previousState.name).to.eq('jeff');
    });

    it('Is no persistState', () => {
        expect(MY_BOOLEAN.isPersistState).to.eq(false);
        expect(MY_STRING.isPersistState).to.eq(false);
        expect(MY_NUMBER.isPersistState).to.eq(false);
        expect(MY_OBJECT.isPersistState).to.eq(false);

        expect(MY_BOOLEAN_WITH_KEY.isPersistState).to.eq(false);
        expect(MY_STRING_WITH_KEY.isPersistState).to.eq(false);
        expect(MY_NUMBER_WITH_KEY.isPersistState).to.eq(false);
        expect(MY_OBJECT_WITH_KEY.isPersistState).to.eq(false);
    });

    it('Has correct isSet value', () => {
        expect(MY_BOOLEAN.isSet).to.eq(false);
        expect(MY_STRING.isSet).to.eq(false);
        expect(MY_NUMBER.isSet).to.eq(false);
        expect(MY_OBJECT.isSet).to.eq(false);

        expect(MY_BOOLEAN.isSet).to.eq(false);
        expect(MY_STRING.isSet).to.eq(false);
        expect(MY_NUMBER.isSet).to.eq(false);
        expect(MY_OBJECT.isSet).to.eq(false);
    });

    describe('Change Key', () => {
        it('Has correct key', () => {
            MY_BOOLEAN.key = 'newBoolean';
            MY_STRING.key = 'newString';
            MY_NUMBER.key = 'newNumber';
            MY_OBJECT.key = 'newObject';

            MY_BOOLEAN_WITH_KEY.key = 'newBoolean';
            MY_STRING_WITH_KEY.key = 'newString';
            MY_NUMBER_WITH_KEY.key = 'newNumber';
            MY_OBJECT_WITH_KEY.key = 'newObject';

            expect(MY_BOOLEAN.key).to.eq('newBoolean');
            expect(MY_STRING.key).to.eq('newString');
            expect(MY_NUMBER.key).to.eq('newNumber');
            expect(MY_OBJECT.key).to.eq('newObject');

            expect(MY_BOOLEAN_WITH_KEY.key).to.eq('newBoolean');
            expect(MY_STRING_WITH_KEY.key).to.eq('newString');
            expect(MY_NUMBER_WITH_KEY.key).to.eq('newNumber');
            expect(MY_OBJECT_WITH_KEY.key).to.eq('newObject');
        });
    });

    describe('Change Value', () => {
        it('Has correct value', () => {
            MY_BOOLEAN.value = false;
            MY_STRING.value = 'bye';
            MY_NUMBER.value = -10;
            MY_OBJECT.value = {name: 'hans'};

            MY_BOOLEAN_WITH_KEY.value = false;
            MY_STRING_WITH_KEY.value = 'bye';
            MY_NUMBER_WITH_KEY.value = -10;
            MY_OBJECT_WITH_KEY.value = {name: 'hans'};

            expect(MY_BOOLEAN.value).to.eq(false);
            expect(MY_STRING.value).to.eq('bye');
            expect(MY_NUMBER.value).to.eq(-10);
            expect(MY_OBJECT.value.name).to.eq('hans');

            expect(MY_BOOLEAN_WITH_KEY.value).to.eq(false);
            expect(MY_STRING_WITH_KEY.value).to.eq('bye');
            expect(MY_NUMBER_WITH_KEY.value).to.eq(-10);
            expect(MY_OBJECT_WITH_KEY.value.name).to.eq('hans');
        });

        it('Has correct isSet value', () => {
            expect(MY_BOOLEAN.isSet).to.eq(true);
            expect(MY_STRING.isSet).to.eq(true);
            expect(MY_NUMBER.isSet).to.eq(true);
            expect(MY_OBJECT.isSet).to.eq(true);

            expect(MY_BOOLEAN.isSet).to.eq(true);
            expect(MY_STRING.isSet).to.eq(true);
            expect(MY_NUMBER.isSet).to.eq(true);
            expect(MY_OBJECT.isSet).to.eq(true);
        });

        it('Has correct initial State', () => {
            expect(MY_BOOLEAN.previousState).to.eq(true);
            expect(MY_STRING.previousState).to.eq('hello');
            expect(MY_NUMBER.previousState).to.eq(10);
            expect(MY_OBJECT.previousState.name).to.eq('jeff');

            expect(MY_BOOLEAN.previousState).to.eq(true);
            expect(MY_STRING.previousState).to.eq('hello');
            expect(MY_NUMBER.previousState).to.eq(10);
            expect(MY_OBJECT.previousState.name).to.eq('jeff');
        });

        it('Has correct previous State', () => {
            expect(MY_BOOLEAN.previousState).to.eq(true);
            expect(MY_STRING.previousState).to.eq('hello');
            expect(MY_NUMBER.previousState).to.eq(10);
            expect(MY_OBJECT.previousState.name).to.eq('jeff');

            expect(MY_BOOLEAN.previousState).to.eq(true);
            expect(MY_STRING.previousState).to.eq('hello');
            expect(MY_NUMBER.previousState).to.eq(10);
            expect(MY_OBJECT.previousState.name).to.eq('jeff');
        });
    });
});
