import 'mocha';
import {expect} from 'chai';
import Agile from "../../src";

describe('Default Event Tests', () => {
    // Define Agile
    const App = new Agile();

    interface EventPayload {
        title: string
        message: string
    }

    describe('Event', () => {
        // Create Event
        const MY_EVENT = App.Event<EventPayload>();

        it('Has correct initial value', () => {
            expect(MY_EVENT.uses).to.eq(0, 'MY_EVENT uses has correct initial value');
            expect(JSON.stringify(MY_EVENT.config)).to.eq(JSON.stringify({enabled: true}), 'MY_EVENT has correct initial config');
            expect(MY_EVENT.callbacks.size).to.eq(0, 'MY_EVENT has correct initial callback size');
            expect(MY_EVENT.key).to.eq(undefined, 'MY_EVENT has correct key');
            expect(MY_EVENT._key).to.eq(undefined, 'MY_EVENT has correct _key');
        });

        it('Can change key', () => {
            // Update key
            MY_EVENT.key = 'myKey';

            expect(MY_EVENT.key).to.eq('myKey', 'MY_EVENT has correct key');
            expect(MY_EVENT._key).to.eq('myKey', 'MY_EVENT has correct _key');
        });
    });

    describe('Event with key', () => {
        // Create Event
        const MY_EVENT = App.Event<EventPayload>({key: 'myKey'});

        it('Has correct initial value', () => {
            expect(MY_EVENT.uses).to.eq(0, 'MY_EVENT uses has correct initial value');
            expect(JSON.stringify(MY_EVENT.config)).to.eq(JSON.stringify({enabled: true, key: 'myKey'}), 'MY_EVENT has correct initial config');
            expect(MY_EVENT.callbacks.size).to.eq(0, 'MY_EVENT has correct initial callback size');
            expect(MY_EVENT.key).to.eq('myKey', 'MY_EVENT has correct key');
            expect(MY_EVENT._key).to.eq('myKey', 'MY_EVENT has correct _key');
        });

        it('Can change key', () => {
            // Update key
            MY_EVENT.key = 'myNewKey';

            expect(MY_EVENT.key).to.eq('myNewKey', 'MY_EVENT has correct key');
            expect(MY_EVENT._key).to.eq('myNewKey', 'MY_EVENT has correct _key');
        });
    });

    describe('Event with enabled = false', () => {
        // Create Event
        const MY_EVENT = App.Event<EventPayload>({enabled: false});

        it('Has correct initial value', () => {
            expect(MY_EVENT.uses).to.eq(0, 'MY_EVENT uses has correct initial value');
            expect(JSON.stringify(MY_EVENT.config)).to.eq(JSON.stringify({enabled: false}), 'MY_EVENT has correct initial config');
            expect(MY_EVENT.callbacks.size).to.eq(0, 'MY_EVENT has correct initial callback size');
        });
    });

    describe('Event with delay', () => {
        // Create Event
        const MY_EVENT = App.Event<EventPayload>({delay: 1000});

        it('Has correct initial value', () => {
            expect(MY_EVENT.uses).to.eq(0, 'MY_EVENT uses has correct initial value');
            expect(JSON.stringify(MY_EVENT.config)).to.eq(JSON.stringify({enabled: true, delay: 1000}), 'MY_EVENT has correct initial config');
            expect(MY_EVENT.callbacks.size).to.eq(0, 'MY_EVENT has correct initial callback size');
        });
    });

    describe('Event with maxUses', () => {
        // Create Event
        const MY_EVENT = App.Event<EventPayload>({maxUses: 10});

        it('Has correct initial value', () => {
            expect(MY_EVENT.uses).to.eq(0, 'MY_EVENT uses has correct initial value');
            expect(JSON.stringify(MY_EVENT.config)).to.eq(JSON.stringify({enabled: true, maxUses: 10}), 'MY_EVENT has correct initial config');
            expect(MY_EVENT.callbacks.size).to.eq(0, 'MY_EVENT has correct initial callback size');
        });
    });
});
