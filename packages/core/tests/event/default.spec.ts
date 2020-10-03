import 'mocha';
import {expect} from 'chai';
import {Agile} from "../../src";

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
            expect(MY_EVENT.enabled).to.eq(true, 'MY_EVENT is enabled');
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
            expect(MY_EVENT.enabled).to.eq(true, 'MY_EVENT is enabled');
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
        let eventCallCount = 0;
        let currentEventPayload;

        // Create Event
        const MY_EVENT = App.Event<EventPayload>({enabled: false});

        MY_EVENT.on((payload) => {
            eventCallCount++;
            currentEventPayload = payload;
        });

        it('Has correct initial value', () => {
            expect(MY_EVENT.uses).to.eq(0, 'MY_EVENT uses has correct initial value');
            expect(JSON.stringify(MY_EVENT.config)).to.eq(JSON.stringify({enabled: false}), 'MY_EVENT has correct initial config');
            expect(MY_EVENT.callbacks.size).to.eq(1, 'MY_EVENT has correct initial callback size');
            expect(MY_EVENT.enabled).to.eq(false, 'MY_EVENT is disabled');

            expect(eventCallCount).to.eq(0, 'eventCallCount has correct initial value');
            expect(currentEventPayload).to.eq(undefined, 'currentEventPayload has correct initial value');
        });

        it('Doesn\'t call event callbacks', () => {
            // Trigger Event
            MY_EVENT.trigger({title: 'test', message: 'messageTest'});

            expect(MY_EVENT.uses).to.eq(0, 'MY_EVENT uses stayed the same');
            expect(MY_EVENT.enabled).to.eq(false, 'MY_EVENT is disabled');

            expect(eventCallCount).to.eq(0, 'eventCallCount stayed the same');
            expect(currentEventPayload).to.eq(undefined, 'currentEventPayload stayed the same');
        });
    });

    describe('Event with delay', () => {
        let eventCallCount = 0;
        let currentEventPayload;

        // Create Event
        const MY_EVENT = App.Event<EventPayload>({delay: 1000});

        MY_EVENT.on((payload) => {
            eventCallCount++;
            currentEventPayload = payload;
        });

        it('Has correct initial value', () => {
            expect(MY_EVENT.uses).to.eq(0, 'MY_EVENT uses has correct initial value');
            expect(JSON.stringify(MY_EVENT.config)).to.eq(JSON.stringify({enabled: true, delay: 1000}), 'MY_EVENT has correct initial config');
            expect(MY_EVENT.callbacks.size).to.eq(1, 'MY_EVENT has correct initial callback size');
            expect(MY_EVENT.enabled).to.eq(true, 'MY_EVENT is enabled');

            expect(eventCallCount).to.eq(0, 'eventCallCount has correct initial value');
            expect(currentEventPayload).to.eq(undefined, 'currentEventPayload has correct initial value');
        });

        it('Does call callbacks with delay', async () => {
            // Trigger Event
            MY_EVENT.trigger({title: 'test', message: 'messageTest'});

            expect(MY_EVENT.uses).to.eq(0, 'MY_EVENT uses stayed the same');
            expect(MY_EVENT.enabled).to.eq(true, 'MY_EVENT is enabled');

            expect(eventCallCount).to.eq(0, 'eventCallCount stayed the same');
            expect(currentEventPayload).to.eq(undefined, 'currentEventPayload stayed the same');

            // Wait one second
            await new Promise(resolve => setTimeout(resolve, 1000));

            expect(MY_EVENT.uses).to.eq(1, 'MY_EVENT uses has been increased by 1');
            expect(MY_EVENT.enabled).to.eq(true, 'MY_EVENT is enabled');

            expect(eventCallCount).to.eq(1, 'eventCallCount has been increased by 1');
            expect(JSON.stringify(currentEventPayload)).to.eq(JSON.stringify({title: 'test', message: 'messageTest'}), 'currentEventPayload has the correct value');
        });
    });

    describe('Event with maxUses', () => {
        let eventCallCount = 0;
        let currentEventPayload;

        // Create Event
        const MY_EVENT = App.Event<EventPayload>({maxUses: 3});

        MY_EVENT.on((payload) => {
            eventCallCount++;
            currentEventPayload = payload;
        });

        it('Has correct initial value', () => {
            expect(MY_EVENT.uses).to.eq(0, 'MY_EVENT uses has correct initial value');
            expect(JSON.stringify(MY_EVENT.config)).to.eq(JSON.stringify({enabled: true, maxUses: 3}), 'MY_EVENT has correct initial config');
            expect(MY_EVENT.callbacks.size).to.eq(1, 'MY_EVENT has correct initial callback size');
            expect(MY_EVENT.enabled).to.eq(true, 'MY_EVENT is enabled');

            expect(eventCallCount).to.eq(0, 'eventCallCount has correct initial value');
            expect(currentEventPayload).to.eq(undefined, 'currentEventPayload has correct initial value');
        });

        it('Get disabled after 3 uses', () => {
            // Trigger Event
            MY_EVENT.trigger({title: 'test', message: 'messageTest'});

            expect(MY_EVENT.enabled).to.eq(true, 'MY_EVENT is enabled');
            expect(MY_EVENT.uses).to.eq(1, 'MY_EVENT uses has been increased by 1');
            expect(eventCallCount).to.eq(1, 'eventCallCount has been increased by 1');
            expect(JSON.stringify(currentEventPayload)).to.eq(JSON.stringify({title: 'test', message: 'messageTest'}), 'currentEventPayload has correct value');

            // Trigger Event
            MY_EVENT.trigger({title: 'test2', message: 'messageTest2'});

            expect(MY_EVENT.enabled).to.eq(true, 'MY_EVENT is enabled');
            expect(MY_EVENT.uses).to.eq(2, 'MY_EVENT uses has been increased by 1');
            expect(eventCallCount).to.eq(2, 'eventCallCount has been increased by 1');
            expect(JSON.stringify(currentEventPayload)).to.eq(JSON.stringify({title: 'test2', message: 'messageTest2'}), 'currentEventPayload has correct value');

            // Trigger Event
            MY_EVENT.trigger({title: 'test3', message: 'messageTest3'});

            expect(MY_EVENT.enabled).to.eq(false, 'MY_EVENT got disabled');
            expect(MY_EVENT.uses).to.eq(3, 'MY_EVENT uses has been increased by 1');
            expect(eventCallCount).to.eq(3, 'eventCallCount has been increased by 1');
            expect(JSON.stringify(currentEventPayload)).to.eq(JSON.stringify({title: 'test3', message: 'messageTest3'}), 'currentEventPayload has correct value');

            // Trigger Event
            MY_EVENT.trigger({title: 'test4', message: 'messageTest4'});

            expect(MY_EVENT.enabled).to.eq(false, 'MY_EVENT is disabled');
            expect(MY_EVENT.uses).to.eq(3, 'MY_EVENT uses stayed the same');
            expect(eventCallCount).to.eq(3, 'eventCallCount stayed the same');
            expect(JSON.stringify(currentEventPayload)).to.eq(JSON.stringify({title: 'test3', message: 'messageTest3'}), 'currentEventPayload stayed the same');
        });
    });
});
