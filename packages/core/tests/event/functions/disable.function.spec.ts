import 'mocha';
import {expect} from 'chai';
import Agile from "../../../src";

describe('Disable Function Tests', () => {
    // Define Agile
    const App = new Agile();

    interface EventPayload {
        title: string
        message: string
    }

    // Create Event
    const MY_EVENT = App.Event<EventPayload>();

    it('Has correct initial value', () => {
        expect(MY_EVENT.uses).to.eq(0, 'MY_EVENT uses has correct initial value');
        expect(JSON.stringify(MY_EVENT.config)).to.eq(JSON.stringify({enabled: true}), 'MY_EVENT has correct initial config');
        expect(MY_EVENT.enabled).to.eq(true, 'MY_EVENT is enabled');
    });

    it('Can disable Event', () => {
        // Disable Event
        MY_EVENT.disable();

        expect(MY_EVENT.uses).to.eq(0, 'MY_EVENT uses stayed the same');
        expect(JSON.stringify(MY_EVENT.config)).to.eq(JSON.stringify({enabled: true}), 'MY_EVENT has correct config');
        expect(MY_EVENT.enabled).to.eq(false, 'MY_EVENT is disabled');
    });
});
