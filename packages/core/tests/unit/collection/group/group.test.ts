import {
  Group,
  Agile,
  Collection,
  StateObserver,
  ComputedTracker,
  Item,
  CollectionPersistent,
  GroupObserver,
  EnhancedState,
  TrackedChangeMethod,
} from '../../../../src';
import { LogMock } from '../../../helper/logMock';

describe('Group Tests', () => {
  interface ItemInterface {
    id: string;
    name: string;
  }

  let dummyAgile: Agile;
  let dummyCollection: Collection<ItemInterface>;

  beforeEach(() => {
    LogMock.mockLogs();

    dummyAgile = new Agile();
    dummyCollection = new Collection<ItemInterface>(dummyAgile, {
      key: 'dummyCollection',
    });

    jest.spyOn(Group.prototype, 'rebuild');
    jest.spyOn(Group.prototype, 'addSideEffect');

    jest.clearAllMocks();
  });

  it('should create Group with no initialItems (default config)', () => {
    // Overwrite methods once to not call it
    jest
      .spyOn(Group.prototype, 'rebuild')
      .mockReturnValueOnce(undefined as any);
    jest
      .spyOn(Group.prototype, 'addSideEffect')
      .mockReturnValueOnce(undefined as any);

    const group = new Group(dummyCollection);

    expect(group.collection()).toBe(dummyCollection);
    expect(group._output).toStrictEqual([]);
    expect(group.nextGroupOutput).toStrictEqual([]);
    expect(group.notFoundItemKeys).toStrictEqual([]);
    expect(group.loadedInitialValue).toBeTruthy();

    // Check if State was called with correct parameters
    expect(group._key).toBeUndefined();
    expect(group.isSet).toBeFalsy();
    expect(group.isPlaceholder).toBeFalsy();
    expect(group.initialStateValue).toStrictEqual([]);
    expect(group._value).toStrictEqual([]);
    expect(group.previousStateValue).toStrictEqual([]);
    expect(group.nextStateValue).toStrictEqual([]);
    expect(group.observers['value']).toBeInstanceOf(StateObserver);
    expect(Array.from(group.observers['value'].dependents)).toStrictEqual([]);
    expect(group.observers['value']._key).toBeUndefined();
    expect(group.observers['output']).toBeInstanceOf(GroupObserver);
    expect(Array.from(group.observers['output'].dependents)).toStrictEqual([]);
    expect(group.observers['output']._key).toBeUndefined();
    expect(group.sideEffects).toStrictEqual({});
    expect(group.computeValueMethod).toBeUndefined();
    expect(group.computeExistsMethod).toBeInstanceOf(Function);
    expect(group.isPersisted).toBeFalsy();
    expect(group.persistent).toBeUndefined();
  });

  it('should create Group with no initialItems (specific config)', () => {
    // Overwrite methods once to not call it
    jest
      .spyOn(Group.prototype, 'rebuild')
      .mockReturnValueOnce(undefined as any);
    jest
      .spyOn(Group.prototype, 'addSideEffect')
      .mockReturnValueOnce(undefined as any);

    const group = new Group(dummyCollection, [], {
      key: 'dummyKey',
      isPlaceholder: true,
    });

    expect(group.collection()).toBe(dummyCollection);
    expect(group._output).toStrictEqual([]);
    expect(group.nextGroupOutput).toStrictEqual([]);
    expect(group.notFoundItemKeys).toStrictEqual([]);
    expect(group.loadedInitialValue).toBeTruthy();

    // Check if State was called with correct parameters
    expect(group._key).toBe('dummyKey');
    expect(group.isSet).toBeFalsy();
    expect(group.isPlaceholder).toBeTruthy();
    expect(group.initialStateValue).toStrictEqual([]);
    expect(group._value).toStrictEqual([]);
    expect(group.previousStateValue).toStrictEqual([]);
    expect(group.nextStateValue).toStrictEqual([]);
    expect(group.observers['value']).toBeInstanceOf(StateObserver);
    expect(Array.from(group.observers['value'].dependents)).toStrictEqual([]);
    expect(group.observers['value']._key).toBe('dummyKey');
    expect(group.observers['output']).toBeInstanceOf(GroupObserver);
    expect(Array.from(group.observers['output'].dependents)).toStrictEqual([]);
    expect(group.observers['output']._key).toBe('dummyKey');
    expect(group.sideEffects).toStrictEqual({});
    expect(group.computeValueMethod).toBeUndefined();
    expect(group.computeExistsMethod).toBeInstanceOf(Function);
    expect(group.isPersisted).toBeFalsy();
    expect(group.persistent).toBeUndefined();
  });

  it('should create Group with initialItems (default config)', () => {
    // Overwrite methods once to not call it
    jest
      .spyOn(Group.prototype, 'rebuild')
      .mockReturnValueOnce(undefined as any);
    jest
      .spyOn(Group.prototype, 'addSideEffect')
      .mockReturnValueOnce(undefined as any);

    const group = new Group(dummyCollection, ['test1', 'test2', 'test3']);

    expect(group.collection()).toBe(dummyCollection);
    expect(group._output).toStrictEqual([]);
    expect(group.nextGroupOutput).toStrictEqual([]);
    expect(group.notFoundItemKeys).toStrictEqual([]);
    expect(group.loadedInitialValue).toBeTruthy();

    // Check if State was called with correct parameters
    expect(group._key).toBeUndefined();
    expect(group.isSet).toBeFalsy();
    expect(group.isPlaceholder).toBeFalsy();
    expect(group.initialStateValue).toStrictEqual(['test1', 'test2', 'test3']);
    expect(group._value).toStrictEqual(['test1', 'test2', 'test3']);
    expect(group.previousStateValue).toStrictEqual(['test1', 'test2', 'test3']);
    expect(group.nextStateValue).toStrictEqual(['test1', 'test2', 'test3']);
    expect(group.observers['value']).toBeInstanceOf(StateObserver);
    expect(group.observers['value']._key).toBeUndefined();
    expect(group.observers['output']).toBeInstanceOf(GroupObserver);
    expect(group.observers['output']._key).toBeUndefined();
    expect(group.sideEffects).toStrictEqual({});
    expect(group.computeValueMethod).toBeUndefined();
    expect(group.computeExistsMethod).toBeInstanceOf(Function);
    expect(group.isPersisted).toBeFalsy();
    expect(group.persistent).toBeUndefined();
  });

  describe('Group Function Tests', () => {
    let group: Group<ItemInterface>;
    let dummyItem1: Item<ItemInterface>;
    let dummyItem2: Item<ItemInterface>;
    let dummyItem3: Item<ItemInterface>;

    beforeEach(() => {
      group = new Group<ItemInterface>(dummyCollection, [], {
        key: 'groupKey',
      });
      dummyCollection.collect({ id: 'dummyItem1Key', name: 'coolName' });
      dummyCollection.collect({ id: 'dummyItem2Key', name: 'coolName' });
      dummyItem1 = dummyCollection.getItem('dummyItem1Key') as any;
      dummyItem2 = dummyCollection.getItem('dummyItem2Key') as any;
      dummyItem3 = new Item(dummyCollection, {
        id: 'dummyItem3Key',
        name: 'coolName',
      });
    });

    describe('output get function tests', () => {
      beforeEach(() => {
        jest.spyOn(ComputedTracker, 'tracked');
      });

      it('should return output of Group and call ComputedTracker.tracked', () => {
        group._output = [
          { id: '1', name: 'Frank' },
          { id: '2', name: 'Hans' },
        ];

        const response = group.output;

        expect(response).toStrictEqual([
          { id: '1', name: 'Frank' },
          { id: '2', name: 'Hans' },
        ]);
        expect(ComputedTracker.tracked).toHaveBeenCalledWith(
          group.observers['output']
        );
      });
    });

    describe('output set function tests', () => {
      it("shouldn't set output to passed value and print error", () => {
        group._output = null as any;

        group.output = [
          { id: '12', name: 'Hans der 3' },
          { id: '99', name: 'Frank' },
        ];

        expect(group._output).toStrictEqual(null);
        expect(LogMock.hasLoggedCode('1C:03:00', [group._key]));
      });
    });

    describe('has function tests', () => {
      beforeEach(() => {
        group._value = ['test1', 'test2'];
      });

      it('should return true if group contains ItemKey', () => {
        expect(group.has('test1')).toBeTruthy();
      });

      it("should return false if group doesn't contain ItemKey", () => {
        expect(group.has('notExistingKey')).toBeFalsy();
      });
    });

    describe('size function tests', () => {
      it('should return size of Group', () => {
        group._value = ['test1', 'test2'];

        expect(group.size).toBe(2);
      });
    });

    describe('remove function tests', () => {
      beforeEach(() => {
        group.nextStateValue = [
          'dummyItem1Key',
          'dummyItem2Key',
          'dummyItem3Key',
        ];
        group.set = jest.fn();
      });

      it('should remove Item from Group (default config)', () => {
        group.remove('dummyItem1Key');

        expect(group.set).toHaveBeenCalledWith(
          ['dummyItem2Key', 'dummyItem3Key'],
          {
            any: {
              trackedChanges: [
                {
                  index: 0,
                  method: TrackedChangeMethod.REMOVE,
                  key: 'dummyItem1Key',
                },
              ],
            },
          }
        );
      });

      it('should remove Item from Group (specific config)', () => {
        group.remove('dummyItem1Key', {
          background: true,
          force: true,
          storage: false,
          softRebuild: false,
        });

        expect(group.set).toHaveBeenCalledWith(
          ['dummyItem2Key', 'dummyItem3Key'],
          {
            background: true,
            force: true,
            storage: false,
            any: { trackedChanges: [] },
          }
        );
      });

      it("shouldn't remove not existing Item from Group", () => {
        group.remove('notExistingKey');

        expect(group.set).not.toHaveBeenCalled();
      });

      it('should remove Items from Group', () => {
        group.remove(['dummyItem1Key', 'notExistingItemKey', 'dummyItem3Key']);

        expect(group.set).toHaveBeenCalledWith(['dummyItem2Key'], {
          any: {
            trackedChanges: [
              {
                index: 0,
                method: TrackedChangeMethod.REMOVE,
                key: 'dummyItem1Key',
              },
              {
                index: 1,
                method: TrackedChangeMethod.REMOVE,
                key: 'dummyItem3Key',
              },
            ],
          },
        });
      });

      it("should remove Item/s from Group that doesn't exist in the Collection in background", () => {
        group.remove('dummyItem3Key');

        expect(group.set).toHaveBeenCalledWith(
          ['dummyItem1Key', 'dummyItem2Key'],
          {
            background: true,
            any: {
              trackedChanges: [
                {
                  index: 2,
                  method: TrackedChangeMethod.REMOVE,
                  key: 'dummyItem3Key',
                },
              ],
            },
          }
        );
      });

      it(
        'should remove Items from Group in background ' +
          'if passing not existing Items to remove ' +
          "and Items that doesn't exist in the Collection",
        () => {
          group.remove(['notExistingItemKey', 'dummyItem3Key']);

          expect(group.set).toHaveBeenCalledWith(
            ['dummyItem1Key', 'dummyItem2Key'],
            {
              background: true,
              any: {
                trackedChanges: [
                  {
                    index: 2,
                    method: TrackedChangeMethod.REMOVE,
                    key: 'dummyItem3Key',
                  },
                ],
              },
            }
          );
        }
      );
    });

    describe('add function tests', () => {
      beforeEach(() => {
        group.nextStateValue = ['placeholder', 'dummyItem1Key', 'placeholder'];
        group.set = jest.fn();
      });

      it('should add Item at the end of the Group (default config)', () => {
        group.add('dummyItem2Key');

        expect(group.set).toHaveBeenCalledWith(
          ['placeholder', 'dummyItem1Key', 'placeholder', 'dummyItem2Key'],
          {
            any: {
              trackedChanges: [
                {
                  index: 2,
                  method: TrackedChangeMethod.ADD,
                  key: 'dummyItem2Key',
                },
              ],
            },
          }
        );
      });

      it('should add Item at the end of the Group (specific config)', () => {
        group.add('dummyItem2Key', {
          background: true,
          force: true,
          storage: false,
          softRebuild: false,
        });

        expect(group.set).toHaveBeenCalledWith(
          ['placeholder', 'dummyItem1Key', 'placeholder', 'dummyItem2Key'],
          {
            background: true,
            force: true,
            storage: false,
            any: { trackedChanges: [] },
          }
        );
      });

      it("should add Item at the beginning of the Group (config.method = 'unshift')", () => {
        group.add('dummyItem2Key', { method: 'unshift' });

        expect(group.set).toHaveBeenCalledWith(
          ['dummyItem2Key', 'placeholder', 'dummyItem1Key', 'placeholder'],
          {
            any: {
              trackedChanges: [
                {
                  index: 0,
                  method: TrackedChangeMethod.ADD,
                  key: 'dummyItem2Key',
                },
              ],
            },
          }
        );
      });

      it("shouldn't add already existing Item to the Group (default config)", () => {
        group.add('dummyItem1Key');

        expect(group.set).not.toHaveBeenCalled();
      });

      it('should add Items at the end of the Group', () => {
        group.add(['dummyItem1Key', 'dummyItem2Key', 'dummyItem3Key']);

        expect(group.set).toHaveBeenCalledWith(
          [
            'placeholder',
            'dummyItem1Key',
            'placeholder',
            'dummyItem2Key',
            'dummyItem3Key',
          ],
          {
            any: {
              trackedChanges: [
                {
                  index: 2,
                  method: TrackedChangeMethod.ADD,
                  key: 'dummyItem2Key',
                },
                {
                  index: 3,
                  method: TrackedChangeMethod.ADD,
                  key: 'dummyItem3Key',
                },
              ],
            },
          }
        );
      });

      it("should add Item that doesn't exist in Collection at the end of the Group in background", () => {
        group.add('dummyItem3Key');

        expect(group.set).toHaveBeenCalledWith(
          ['placeholder', 'dummyItem1Key', 'placeholder', 'dummyItem3Key'],
          {
            background: true,
            any: {
              trackedChanges: [
                {
                  index: 2,
                  method: TrackedChangeMethod.ADD,
                  key: 'dummyItem3Key',
                },
              ],
            },
          }
        );
      });

      it(
        'should add Items at the end of the Group in background ' +
          'if passing already added Items ' +
          "and Items that doesn't exist in the Collection",
        () => {
          group.add(['dummyItem1Key', 'dummyItem3Key']);

          expect(group.set).toHaveBeenCalledWith(
            ['placeholder', 'dummyItem1Key', 'placeholder', 'dummyItem3Key'],
            {
              background: true,
              any: {
                trackedChanges: [
                  {
                    index: 2,
                    method: TrackedChangeMethod.ADD,
                    key: 'dummyItem3Key',
                  },
                ],
              },
            }
          );
        }
      );
    });

    describe('replace function tests', () => {
      beforeEach(() => {
        group._value = [1, 2, 3, 4, 5, 6];

        group.set = jest.fn();
      });

      it('should replace oldItemKey with new ItemKey (default config)', () => {
        group.replace(4, 20);

        expect(group.set).toHaveBeenCalledWith([1, 2, 3, 20, 5, 6], {});
      });

      it('should replace oldItemKey with new ItemKey (specific config)', () => {
        group.replace(2, 20, {
          storage: true,
          sideEffects: {
            enabled: false,
          },
        });

        expect(group.set).toHaveBeenCalledWith([1, 20, 3, 4, 5, 6], {
          storage: true,
          sideEffects: {
            enabled: false,
          },
        });
      });
    });

    describe('getItems function tests', () => {
      beforeEach(() => {
        group._value = ['dummyItem1Key', 'dummyItem3Key', 'dummyItem2Key'];
      });

      it('should return all existing Items of the Group', () => {
        const items = group.getItems();

        expect(items).toStrictEqual([dummyItem1, dummyItem2]);
      });
    });

    describe('persist function tests', () => {
      beforeEach(() => {
        jest.spyOn(EnhancedState.prototype, 'persist');
      });

      it('should persist Group with formatted groupKey (default config)', () => {
        group.persist();

        expect(EnhancedState.prototype.persist).toHaveBeenCalledWith(
          CollectionPersistent.getGroupStorageKey(
            group._key,
            dummyCollection._key
          ),
          {
            loadValue: true,
            storageKeys: [],
            defaultStorageKey: null,
          }
        );
      });

      it('should persist Group with formatted groupKey (specific config)', () => {
        group.persist({
          loadValue: false,
          storageKeys: ['test1', 'test2'],
          defaultStorageKey: 'test1',
        });

        expect(EnhancedState.prototype.persist).toHaveBeenCalledWith(
          CollectionPersistent.getGroupStorageKey(
            group._key,
            dummyCollection._key
          ),
          {
            loadValue: false,
            storageKeys: ['test1', 'test2'],
            defaultStorageKey: 'test1',
          }
        );
      });

      it('should persist Group with formatted specified key (default config)', () => {
        group.persist('dummyKey');

        expect(EnhancedState.prototype.persist).toHaveBeenCalledWith(
          CollectionPersistent.getGroupStorageKey(
            'dummyKey',
            dummyCollection._key
          ),
          {
            loadValue: true,
            storageKeys: [],
            defaultStorageKey: null,
          }
        );
      });

      it('should persist Group with formatted specified key (specific config)', () => {
        group.persist('dummyKey', {
          loadValue: false,
          storageKeys: ['test1', 'test2'],
          defaultStorageKey: 'test1',
        });

        expect(EnhancedState.prototype.persist).toHaveBeenCalledWith(
          CollectionPersistent.getGroupStorageKey(
            'dummyKey',
            dummyCollection._key
          ),
          {
            loadValue: false,
            storageKeys: ['test1', 'test2'],
            defaultStorageKey: 'test1',
          }
        );
      });

      it('should persist Group with groupKey (config.followCollectionPersistKeyPattern = false)', () => {
        group.persist({ followCollectionPersistKeyPattern: false });

        expect(EnhancedState.prototype.persist).toHaveBeenCalledWith(
          group._key,
          {
            loadValue: true,
            storageKeys: [],
            defaultStorageKey: null,
          }
        );
      });

      it('should persist Group with specified key (config.followCollectionPersistKeyPattern = false)', () => {
        group.persist('dummyKey', { followCollectionPersistKeyPattern: false });

        expect(EnhancedState.prototype.persist).toHaveBeenCalledWith(
          'dummyKey',
          {
            loadValue: true,
            storageKeys: [],
            defaultStorageKey: null,
          }
        );
      });
    });

    describe('rebuild function tests', () => {
      beforeEach(() => {
        group._value = ['dummyItem1Key', 'dummyItem3Key', 'dummyItem2Key'];
        group.observers['output'].ingestOutput = jest.fn();
      });

      it('should ingest the built Group output and set notFoundItemKeys to the not found Item Keys (default config)', () => {
        group.rebuild();

        expect(group.notFoundItemKeys).toStrictEqual(['dummyItem3Key']);
        expect(group._output).toStrictEqual([]); // because of mocking 'ingestValue'
        expect(group.observers['output'].ingestOutput).toHaveBeenCalledWith(
          [dummyItem1, dummyItem2],
          {}
        );

        LogMock.hasLoggedCode(
          '1C:02:00',
          [dummyCollection._key, group._key],
          ['dummyItem3Key']
        );
      });

      it('should ingest the built Group output and set notFoundItemKeys to the not found Item Keys (specific config)', () => {
        group.rebuild({ background: true, force: false });

        expect(group.notFoundItemKeys).toStrictEqual(['dummyItem3Key']);
        expect(group._output).toStrictEqual([]); // because of mocking 'ingestValue'
        expect(group.observers['output'].ingestOutput).toHaveBeenCalledWith(
          [dummyItem1, dummyItem2],
          { background: true, force: false }
        );

        LogMock.hasLoggedCode(
          '1C:02:00',
          [dummyCollection._key, group._key],
          ['dummyItem3Key']
        );
      });

      it("shouldn't intest the build Group output if the Collection was not properly instantiated", () => {
        dummyCollection.isInstantiated = false;

        group.rebuild();

        expect(group.notFoundItemKeys).toStrictEqual([]);
        expect(group._output).toStrictEqual([]);
        expect(group.observers['output'].ingestOutput).not.toHaveBeenCalled();
        LogMock.hasNotLogged('warn');
      });
    });
  });
});
