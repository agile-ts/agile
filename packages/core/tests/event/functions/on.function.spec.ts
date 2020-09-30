import 'mocha';
import {expect} from 'chai';
import {Agile} from "../../../src";

describe('On Function Tests', () => {
    let eventCallCount = 0;
    let currentEventPayload;

    // Define Agile
    const App = new Agile();

    interface EventPayload {
        title: string
        message: string
    }

    // Create Event
    const MY_EVENT = App.Event<EventPayload>();

    MY_EVENT.on((payload) => {
        eventCallCount++;
        currentEventPayload = payload;
    });

    it('Has correct initial value', () => {
        expect(MY_EVENT.uses).to.eq(0, 'MY_EVENT uses has correct initial value');
        expect(JSON.stringify(MY_EVENT.config)).to.eq(JSON.stringify({enabled: true}), 'MY_EVENT has correct initial config');
        expect(MY_EVENT.callbacks.size).to.eq(1, 'MY_EVENT has correct callbacks size');
        expect(MY_EVENT.enabled).to.eq(true, 'MY_EVENT is enabled');

        expect(eventCallCount).to.eq(0, 'eventCallCount has correct initial size');
        expect(currentEventPayload).to.eq(undefined, 'currentEventPayload has correct initial value');
    });

    it('Does call on callback by triggering Event', async () => {
        // Trigger Event
        MY_EVENT.trigger({title: "Hello", message: "There"});

        expect(MY_EVENT.uses).to.eq(1, 'MY_EVENT uses has been increased by 1');

        expect(eventCallCount).to.eq(1, 'eventCallCount has been increased by 2');
        expect(JSON.stringify(currentEventPayload)).to.eq(JSON.stringify({
            title: "Hello",
            message: "There"
        }), 'currentEventPayload has correct value');
    });
});
