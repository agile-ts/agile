import { Storage } from '../../../src';
import * as StorageIndex from '../../../src/storages/index';
import { LogMock } from '../../helper/logMock';

jest.mock('../../../src/storages/storage');

describe('Storages Index Tests', () => {
  beforeEach(() => {
    LogMock.mockLogs();
    jest.clearAllMocks();
  });

  describe('createStorage function tests', () => {
    const StorageMock = Storage as jest.MockedClass<typeof Storage>;

    beforeEach(() => {
      StorageMock.mockClear();
    });

    it('should create Storage', () => {
      const storageConfig = {
        prefix: 'test',
        methods: {
          get: () => {
            /* empty function */
          },
          set: () => {
            /* empty function */
          },
          remove: () => {
            /* empty function */
          },
        },
        key: 'myTestStorage',
      };

      const storage = StorageIndex.createStorage(storageConfig);

      expect(storage).toBeInstanceOf(Storage);
      expect(StorageMock).toHaveBeenCalledWith(storageConfig);
    });
  });
});
