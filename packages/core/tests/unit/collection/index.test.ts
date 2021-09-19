import {
  Agile,
  assignSharedAgileInstance,
  Collection,
  createCollection,
} from '../../../src';
import { LogMock } from '../../helper/logMock';

jest.mock('../../../src/collection/collection');

describe('Collection Index Tests', () => {
  let sharedAgileInstance: Agile;

  beforeEach(() => {
    LogMock.mockLogs();

    sharedAgileInstance = new Agile();
    assignSharedAgileInstance(sharedAgileInstance);

    jest.clearAllMocks();
  });

  describe('createCollection function tests', () => {
    const CollectionMock = Collection as jest.MockedClass<typeof Collection>;

    beforeEach(() => {
      CollectionMock.mockClear();
    });

    it('should create Collection with the shared Agile Instance', () => {
      const collectionConfig = {
        selectors: ['test', 'test1'],
        groups: ['test2', 'test10'],
        defaultGroupKey: 'frank',
        key: 'myCoolCollection',
      };

      const collection = createCollection(collectionConfig);

      expect(collection).toBeInstanceOf(Collection);
      expect(CollectionMock).toHaveBeenCalledWith(
        sharedAgileInstance,
        collectionConfig
      );
    });

    it('should create Collection with a specified Agile Instance', () => {
      const agile = new Agile();
      const collectionConfig = {
        selectors: ['test', 'test1'],
        groups: ['test2', 'test10'],
        defaultGroupKey: 'frank',
        key: 'myCoolCollection',
      };

      const collection = createCollection(collectionConfig, agile);

      expect(collection).toBeInstanceOf(Collection);
      expect(CollectionMock).toHaveBeenCalledWith(agile, collectionConfig);
    });
  });
});
