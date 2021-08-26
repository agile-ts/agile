import {
  Agile,
  Storages,
  Storage,
  assignSharedAgileInstance,
} from '../../../src';
import * as StorageIndex from '../../../src/storages/index';
import { LogMock } from '../../helper/logMock';
jest.mock('../../../src/storages/storages');
jest.mock('../../../src/storages/storage');

describe('Storages Index', () => {
  let sharedAgileInstance: Agile;

  beforeEach(() => {
    LogMock.mockLogs();

    sharedAgileInstance = new Agile();
    assignSharedAgileInstance(sharedAgileInstance);

    StorageIndex.assignSharedAgileStorageManager(null);

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

  describe('createStorageManager function tests', () => {
    const StoragesMock = Storages as jest.MockedClass<typeof Storages>;

    beforeEach(() => {
      StoragesMock.mockClear();
    });

    it('should create Storage Manager (Storages) with the shared Agile Instance', () => {
      const storageManager = StorageIndex.createStorageManager({
        localStorage: true,
      });

      expect(storageManager).toBeInstanceOf(Storages);
      expect(StoragesMock).toHaveBeenCalledWith(sharedAgileInstance, {
        localStorage: true,
      });
    });

    it('should create Storage Manager (Storages) with a specified Agile Instance', () => {
      const agile = new Agile();

      const storageManager = StorageIndex.createStorageManager({
        agileInstance: agile,
        localStorage: true,
      });

      expect(storageManager).toBeInstanceOf(Storages);
      expect(StoragesMock).toHaveBeenCalledWith(agile, { localStorage: true });
    });
  });

  describe('getStorageManager function tests', () => {
    beforeEach(() => {
      StorageIndex.assignSharedAgileStorageManager(null);

      jest.spyOn(StorageIndex, 'assignSharedAgileStorageManager');
      jest.spyOn(StorageIndex, 'createStorageManager');
    });

    it('should return shared Storage Manager', () => {
      const createdStorageManager = new Storages(sharedAgileInstance, {
        localStorage: false,
      });
      StorageIndex.assignSharedAgileStorageManager(createdStorageManager);
      jest.clearAllMocks();

      const returnedStorageManager = StorageIndex.getStorageManager();

      expect(returnedStorageManager).toBeInstanceOf(Storages);
      expect(returnedStorageManager).toBe(createdStorageManager);
      expect(StorageIndex.createStorageManager).not.toHaveBeenCalled();
      expect(
        StorageIndex.assignSharedAgileStorageManager
      ).not.toHaveBeenCalled();
    });

    // TODO doesn't work although it should 100% work?!
    // it(
    //   'should return newly created Storage Manager ' +
    //     'if no shared Storage Manager was registered yet',
    //   () => {
    //     const createdStorageManager = new Storages(sharedAgileInstance, {
    //       localStorage: false,
    //     });
    //     jest
    //       .spyOn(StorageIndex, 'createStorageManager')
    //       .mockReturnValueOnce(createdStorageManager);
    //
    //     const returnedStorageManager = StorageIndex.getStorageManager();
    //
    //     expect(returnedStorageManager).toBeInstanceOf(Storages);
    //     expect(returnedStorageManager).toBe(createdStorageManager);
    //     expect(StorageIndex.createStorageManager).toHaveBeenCalledWith({
    //       localStorage: false,
    //     });
    //     expect(
    //       StorageIndex.assignSharedAgileStorageManager
    //     ).toHaveBeenCalledWith(createdStorageManager);
    //   }
    // );
  });

  describe('assignSharedAgileStorageManager function tests', () => {
    it('should assign the specified Storage Manager as shared Storage Manager', () => {
      const storageManager = new Storages(sharedAgileInstance);

      StorageIndex.assignSharedAgileStorageManager(storageManager);

      expect(StorageIndex.getStorageManager()).toBe(storageManager);
      LogMock.hasNotLoggedCode('11:02:06');
    });

    it(
      'should assign the specified Storage Manager as shared Storage Manager' +
        'and print warning if a shared Storage Manager is already set',
      () => {
        const oldStorageManager = new Storages(sharedAgileInstance);
        StorageIndex.assignSharedAgileStorageManager(oldStorageManager);
        const storageManager = new Storages(sharedAgileInstance);

        StorageIndex.assignSharedAgileStorageManager(storageManager);

        expect(StorageIndex.getStorageManager()).toBe(storageManager);
        LogMock.hasLoggedCode('11:02:06', [], oldStorageManager);
      }
    );
  });
});
