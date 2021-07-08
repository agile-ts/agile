import { Agile, assignSharedAgileInstance } from '@agile-ts/core';
import { Event, createEvent } from '../../src';
import { LogMock } from '../../../core/tests/helper/logMock';

jest.mock('../../src/event');

describe('Shared Tests', () => {
  let sharedAgileInstance: Agile;

  beforeEach(() => {
    LogMock.mockLogs();

    sharedAgileInstance = new Agile();
    assignSharedAgileInstance(sharedAgileInstance);

    jest.clearAllMocks();
  });

  describe('createEvent function tests', () => {
    const EventMock = Event as jest.MockedClass<typeof Event>;

    it('should create Event with the shared Agile Instance', () => {
      const event = createEvent({
        key: 'myCoolState',
        delay: 10,
      });

      expect(event).toBeInstanceOf(Event);
      expect(EventMock).toHaveBeenCalledWith(sharedAgileInstance, {
        key: 'myCoolState',
        delay: 10,
      });
    });

    it('should create Event with a specified Agile Instance', () => {
      const agile = new Agile();

      const event = createEvent({
        key: 'myCoolState',
        delay: 10,
        agileInstance: agile,
      });

      expect(event).toBeInstanceOf(Event);
      expect(EventMock).toHaveBeenCalledWith(agile, {
        key: 'myCoolState',
        delay: 10,
      });
    });
  });
});
