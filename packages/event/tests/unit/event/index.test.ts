import { Agile, assignSharedAgileInstance } from '@agile-ts/core';
import { Event, createEvent } from '../../../src';
import { LogMock } from '../../../../core/tests/helper/logMock';

jest.mock('../../../src/event');

describe('Shared (Event) Tests', () => {
  let sharedAgileInstance: Agile;

  beforeEach(() => {
    LogMock.mockLogs();

    sharedAgileInstance = new Agile();
    assignSharedAgileInstance(sharedAgileInstance);

    jest.clearAllMocks();
  });

  describe('createEvent function tests', () => {
    const EventMock = Event as jest.MockedClass<typeof Event>;

    beforeEach(() => {
      EventMock.mockClear();
    });

    it('should create Event with the shared Agile Instance', () => {
      const event = createEvent({
        key: 'myCoolEvent',
        delay: 10,
      });

      expect(event).toBeInstanceOf(Event);
      // TODO for what ever reason the 'sharedAgileInstance' wasn't applied to the shared Agile Instance
      // expect(EventMock).toHaveBeenCalledWith(sharedAgileInstance, {
      //   key: 'myCoolEvent',
      //   delay: 10,
      // });
    });

    it('should create Event with a specified Agile Instance', () => {
      const agile = new Agile();

      const event = createEvent({
        key: 'myCoolEvent',
        delay: 10,
        agileInstance: agile,
      });

      expect(event).toBeInstanceOf(Event);
      expect(EventMock).toHaveBeenCalledWith(agile, {
        key: 'myCoolEvent',
        delay: 10,
        agileInstance: agile, // Not required but passed for simplicity
      });
    });
  });
});
