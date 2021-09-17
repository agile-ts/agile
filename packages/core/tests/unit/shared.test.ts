import {
  Agile,
  shared,
  assignSharedAgileInstance,
  State,
  Collection,
  Observer,
  getAgileInstance,
} from '../../src';
import { LogMock } from '../helper/logMock';

describe('Shared (Agile) Tests', () => {
  let dummyAgile: Agile;

  beforeEach(() => {
    LogMock.mockLogs();

    dummyAgile = new Agile();

    jest.clearAllMocks();
  });

  describe('getAgileInstance function tests', () => {
    beforeEach(() => {
      assignSharedAgileInstance(dummyAgile);
      globalThis[Agile.globalKey] = dummyAgile;
    });

    it('should return Agile Instance from State', () => {
      const dummyState = new State(dummyAgile, 'dummyValue');

      expect(getAgileInstance(dummyState)).toBe(dummyAgile);
    });

    it('should return Agile Instance from Collection', () => {
      const dummyCollection = new Collection(dummyAgile);

      expect(getAgileInstance(dummyCollection)).toBe(dummyAgile);
    });

    it('should return Agile Instance from Observer', () => {
      const dummyObserver = new Observer(dummyAgile);

      expect(getAgileInstance(dummyObserver)).toBe(dummyAgile);
    });

    it(
      'should return shared Agile Instance ' +
        'if specified Instance contains no valid Agile Instance',
      () => {
        expect(getAgileInstance('weiredInstance')).toBe(dummyAgile);
      }
    );

    it(
      'should return globally bound Agile Instance' +
        'if specified Instance contains no valid Agile Instance' +
        'and no shared Agile Instance was specified',
      () => {
        // Destroy shared Agile Instance
        assignSharedAgileInstance(undefined as any);

        expect(getAgileInstance('weiredInstance')).toBe(dummyAgile);
      }
    );

    it('should print error if no Agile Instance could be retrieved', () => {
      // @ts-ignore | Destroy globalThis
      globalThis = undefined;

      // Destroy shared Agile Instance
      assignSharedAgileInstance(undefined as any);

      const response = getAgileInstance('weiredInstance');

      expect(response).toBeUndefined();
      LogMock.hasLoggedCode('20:03:00', [], 'weiredInstance');
    });
  });

  describe('assignSharedAgileInstance function tests', () => {
    beforeEach(() => {
      assignSharedAgileInstance(dummyAgile);
    });

    it('should assign the specified Agile Instance as new shared Agile Instance', () => {
      const newAgileInstance = new Agile({ key: 'notShared' });

      assignSharedAgileInstance(newAgileInstance);

      expect(shared).toBe(newAgileInstance);
    });
  });
});
