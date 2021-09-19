import { Agile, Storages, assignSharedAgileInstance } from '../../../src';
import * as SharedStorageManager from '../../../src/storages/shared';
import { LogMock } from '../../helper/logMock';

jest.mock('../../../src/storages/storages');

describe('Shared (Storage) Tests', () => {
  let sharedAgileInstance: Agile;

  beforeEach(() => {
    LogMock.mockLogs();

    sharedAgileInstance = new Agile();
    assignSharedAgileInstance(sharedAgileInstance);

    // Reset Storage Manager
    SharedStorageManager.assignSharedStorageManager(null);

    jest.clearAllMocks();
  });

  describe('createStorageManager function tests', () => {
    const StoragesMock = Storages as jest.MockedClass<typeof Storages>;

    beforeEach(() => {
      StoragesMock.mockClear();
    });

    it('should create Storage Manager (Storages) with the shared Agile Instance', () => {
      const storageManager = SharedStorageManager.createStorageManager({
        localStorage: true,
      });

      expect(storageManager).toBeInstanceOf(Storages);
      expect(StoragesMock).toHaveBeenCalledWith(sharedAgileInstance, {
        localStorage: true,
      });
    });

    it('should create Storage Manager (Storages) with a specified Agile Instance', () => {
      const agile = new Agile();

      const storageManager = SharedStorageManager.createStorageManager({
        agileInstance: agile,
        localStorage: true,
      });

      expect(storageManager).toBeInstanceOf(Storages);
      expect(StoragesMock).toHaveBeenCalledWith(agile, { localStorage: true });
    });
  });

  describe('getStorageManager function tests', () => {
    beforeEach(() => {
      SharedStorageManager.assignSharedStorageManager(null);

      jest.spyOn(SharedStorageManager, 'assignSharedStorageManager');
      jest.spyOn(SharedStorageManager, 'createStorageManager');
    });

    it('should return shared Storage Manager', () => {
      const createdStorageManager = new Storages(sharedAgileInstance, {
        localStorage: false,
      });
      SharedStorageManager.assignSharedStorageManager(createdStorageManager);
      jest.clearAllMocks();

      const returnedStorageManager = SharedStorageManager.getStorageManager();

      expect(returnedStorageManager).toBeInstanceOf(Storages);
      expect(returnedStorageManager).toBe(createdStorageManager);
      expect(SharedStorageManager.createStorageManager).not.toHaveBeenCalled();
      expect(
        SharedStorageManager.assignSharedStorageManager
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
    //       .spyOn(SharedStorageManager, 'createStorageManager')
    //       .mockReturnValueOnce(createdStorageManager);
    //     jest.clearAllMocks();
    //
    //     const returnedStorageManager = SharedStorageManager.getStorageManager();
    //
    //     expect(returnedStorageManager).toBeInstanceOf(Storages);
    //     expect(returnedStorageManager).toBe(createdStorageManager);
    //     expect(SharedStorageManager.createStorageManager).toHaveBeenCalledWith({
    //       localStorage: false,
    //     });
    //     expect(
    //       SharedStorageManager.assignSharedAgileStorageManager
    //     ).toHaveBeenCalledWith(createdStorageManager);
    //   }
    // );
  });

  describe('assignSharedStorageManager function tests', () => {
    it('should assign the specified Storage Manager as shared Storage Manager', () => {
      const storageManager = new Storages(sharedAgileInstance);

      SharedStorageManager.assignSharedStorageManager(storageManager);

      expect(SharedStorageManager.getStorageManager()).toBe(storageManager);
    });
  });
});
