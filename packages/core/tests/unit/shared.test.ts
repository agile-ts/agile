import {
  Agile,
  Collection,
  Computed,
  shared,
  createCollection,
  createComputed,
  assignSharedAgileInstance,
} from '../../src';
import { LogMock } from '../helper/logMock';

describe('Shared Tests', () => {
  let sharedAgileInstance: Agile;

  beforeEach(() => {
    LogMock.mockLogs();

    sharedAgileInstance = new Agile();
    assignSharedAgileInstance(sharedAgileInstance);

    jest.clearAllMocks();
  });

  describe('assignSharedAgileInstance function tests', () => {
    it('should assign the specified Agile Instance as new shared Agile Instance', () => {
      const newAgileInstance = new Agile({ key: 'notShared' });

      assignSharedAgileInstance(newAgileInstance);

      expect(shared).toBe(newAgileInstance);
    });
  });
});
