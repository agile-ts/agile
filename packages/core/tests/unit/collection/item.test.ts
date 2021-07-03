import {
  Item,
  Collection,
  Agile,
  StateObserver,
  State,
  CollectionPersistent,
} from '../../../src';
import { LogMock } from '../../helper/logMock';

describe('Item Tests', () => {
  interface ItemInterface {
    id: string;
    name: string;
  }

  let dummyAgile: Agile;
  let dummyCollection: Collection<ItemInterface>;

  beforeEach(() => {
    LogMock.mockLogs();

    dummyAgile = new Agile({ localStorage: false });
    dummyCollection = new Collection<ItemInterface>(dummyAgile);

    jest.spyOn(Item.prototype, 'addRebuildGroupThatIncludeItemKeySideEffect');

    jest.clearAllMocks();
  });

  it('should create Item (default config)', () => {
    // Overwrite addRebuildGroupThatIncludeItemKeySideEffect once to not call it
    jest
      .spyOn(Item.prototype, 'addRebuildGroupThatIncludeItemKeySideEffect')
      .mockReturnValueOnce(undefined);

    const dummyData = { id: 'dummyId', name: 'dummyName' };
    const item = new Item(dummyCollection, dummyData);

    expect(item.collection()).toBe(dummyCollection);
    expect(
      item.addRebuildGroupThatIncludeItemKeySideEffect
    ).toHaveBeenCalledWith('dummyId');

    expect(item._key).toBe(dummyData[dummyCollection.config.primaryKey]);
    expect(item.valueType).toBeUndefined();
    expect(item.isSet).toBeFalsy();
    expect(item.isPlaceholder).toBeFalsy();
    expect(item.initialStateValue).toStrictEqual(dummyData);
    expect(item._value).toStrictEqual(dummyData);
    expect(item.previousStateValue).toStrictEqual(dummyData);
    expect(item.nextStateValue).toStrictEqual(dummyData);
    expect(item.observers['value']).toBeInstanceOf(StateObserver);
    expect(Array.from(item.observers['value'].dependents)).toStrictEqual([]);
    expect(item.observers['value']._key).toBe(
      dummyData[dummyCollection.config.primaryKey]
    );
    expect(item.sideEffects).toStrictEqual({});
    expect(item.computeValueMethod).toBeUndefined();
    expect(item.computeExistsMethod).toBeInstanceOf(Function);
    expect(item.isPersisted).toBeFalsy();
    expect(item.persistent).toBeUndefined();
    expect(item.watchers).toStrictEqual({});
    expect(item.selectedBy.size).toBe(0);
  });

  it('should create Item (specific config)', () => {
    // Overwrite addRebuildGroupThatIncludeItemKeySideEffect once to not call it
    jest
      .spyOn(Item.prototype, 'addRebuildGroupThatIncludeItemKeySideEffect')
      .mockReturnValueOnce(undefined);

    const dummyData = { id: 'dummyId', name: 'dummyName' };
    const item = new Item(dummyCollection, dummyData, {
      isPlaceholder: true,
    });

    expect(item.collection()).toBe(dummyCollection);
    expect(
      item.addRebuildGroupThatIncludeItemKeySideEffect
    ).toHaveBeenCalledWith('dummyId');

    // Check if State was called with correct parameters
    expect(item._key).toBe(dummyData[dummyCollection.config.primaryKey]);
    expect(item.valueType).toBeUndefined();
    expect(item.isSet).toBeFalsy();
    expect(item.isPlaceholder).toBeTruthy();
    expect(item.initialStateValue).toStrictEqual(dummyData);
    expect(item._value).toStrictEqual(dummyData);
    expect(item.previousStateValue).toStrictEqual(dummyData);
    expect(item.nextStateValue).toStrictEqual(dummyData);
    expect(item.observers['value']).toBeInstanceOf(StateObserver);
    expect(Array.from(item.observers['value'].dependents)).toStrictEqual([]);
    expect(item.observers['value']._key).toBe(
      dummyData[dummyCollection.config.primaryKey]
    );
    expect(item.sideEffects).toStrictEqual({});
    expect(item.computeValueMethod).toBeUndefined();
    expect(item.computeExistsMethod).toBeInstanceOf(Function);
    expect(item.isPersisted).toBeFalsy();
    expect(item.persistent).toBeUndefined();
    expect(item.watchers).toStrictEqual({});
    expect(item.selectedBy.size).toBe(0);
  });

  it("should create Item and shouldn't add rebuild Group side effect to it if no itemKey was provided (default config)", () => {
    // Overwrite addRebuildGroupThatIncludeItemKeySideEffect once to not call it
    jest
      .spyOn(Item.prototype, 'addRebuildGroupThatIncludeItemKeySideEffect')
      .mockReturnValueOnce(undefined);

    const dummyData = { name: 'dummyName' };
    const item = new Item(dummyCollection, dummyData as any);

    expect(item.collection()).toBe(dummyCollection);
    expect(
      item.addRebuildGroupThatIncludeItemKeySideEffect
    ).not.toHaveBeenCalled();

    // Check if State was called with correct parameters
    expect(item._key).toBeUndefined();
    expect(item.valueType).toBeUndefined();
    expect(item.isSet).toBeFalsy();
    expect(item.isPlaceholder).toBeFalsy();
    expect(item.initialStateValue).toStrictEqual(dummyData);
    expect(item._value).toStrictEqual(dummyData);
    expect(item.previousStateValue).toStrictEqual(dummyData);
    expect(item.nextStateValue).toStrictEqual(dummyData);
    expect(item.observers['value']).toBeInstanceOf(StateObserver);
    expect(Array.from(item.observers['value'].dependents)).toStrictEqual([]);
    expect(item.observers['value']._key).toBe(
      dummyData[dummyCollection.config.primaryKey]
    );
    expect(item.sideEffects).toStrictEqual({});
    expect(item.computeValueMethod).toBeUndefined();
    expect(item.computeExistsMethod).toBeInstanceOf(Function);
    expect(item.isPersisted).toBeFalsy();
    expect(item.persistent).toBeUndefined();
    expect(item.watchers).toStrictEqual({});
    expect(item.selectedBy.size).toBe(0);
  });

  describe('Item Function Tests', () => {
    let item: Item<ItemInterface>;

    beforeEach(() => {
      item = new Item(dummyCollection, { id: 'dummyId', name: 'dummyName' });
    });

    describe('setKey function tests', () => {
      beforeEach(() => {
        item.removeSideEffect = jest.fn();
        item.patch = jest.fn();
        jest.spyOn(State.prototype, 'setKey');
      });

      it('should call State setKey, add rebuildGroup sideEffect to Item and patch newItemKey into Item (default config)', () => {
        item.setKey('myNewKey');

        expect(State.prototype.setKey).toHaveBeenCalledWith('myNewKey');
        expect(item.removeSideEffect).toHaveBeenCalledWith(
          Item.updateGroupSideEffectKey
        );
        expect(
          item.addRebuildGroupThatIncludeItemKeySideEffect
        ).toHaveBeenCalledWith('myNewKey');
        expect(item.patch).toHaveBeenCalledWith(
          {
            [dummyCollection.config.primaryKey]: 'myNewKey',
          },
          {
            sideEffects: {
              enabled: true,
              exclude: [],
            },
            background: false,
            force: false,
            storage: true,
            overwrite: false,
          }
        );
      });

      it('should call State setKey, add rebuildGroup sideEffect to Item and patch newItemKey into Item (specific config)', () => {
        item.setKey('myNewKey', {
          sideEffects: {
            enabled: false,
          },
          background: true,
          force: true,
        });

        expect(State.prototype.setKey).toHaveBeenCalledWith('myNewKey');
        expect(item.removeSideEffect).toHaveBeenCalledWith(
          Item.updateGroupSideEffectKey
        );
        expect(
          item.addRebuildGroupThatIncludeItemKeySideEffect
        ).toHaveBeenCalledWith('myNewKey');
        expect(item.patch).toHaveBeenCalledWith(
          {
            [dummyCollection.config.primaryKey]: 'myNewKey',
          },
          {
            sideEffects: {
              enabled: false,
            },
            background: true,
            force: true,
            storage: true,
            overwrite: false,
          }
        );
      });
    });

    describe('persist function tests', () => {
      beforeEach(() => {
        jest.spyOn(State.prototype, 'persist');
      });

      it('should persist Item with formatted itemKey (default config)', () => {
        item.persist();

        expect(State.prototype.persist).toHaveBeenCalledWith(
          CollectionPersistent.getItemStorageKey(
            item._key,
            dummyCollection._key
          ),
          {
            loadValue: true,
            storageKeys: [],
            defaultStorageKey: null,
          }
        );
      });

      it('should persist Item with formatted itemKey (specific config)', () => {
        item.persist({
          loadValue: false,
          storageKeys: ['test1', 'test2'],
          defaultStorageKey: 'test1',
        });

        expect(State.prototype.persist).toHaveBeenCalledWith(
          CollectionPersistent.getItemStorageKey(
            item._key,
            dummyCollection._key
          ),
          {
            loadValue: false,
            storageKeys: ['test1', 'test2'],
            defaultStorageKey: 'test1',
          }
        );
      });

      it('should persist Item with formatted specified key (default config)', () => {
        item.persist('dummyKey');

        expect(State.prototype.persist).toHaveBeenCalledWith(
          CollectionPersistent.getItemStorageKey(
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

      it('should persist Item with formatted specified key (specific config)', () => {
        item.persist('dummyKey', {
          loadValue: false,
          storageKeys: ['test1', 'test2'],
          defaultStorageKey: 'test1',
        });

        expect(State.prototype.persist).toHaveBeenCalledWith(
          CollectionPersistent.getItemStorageKey(
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

      it('should persist Item with itemKey (config.followCollectionPersistKeyPattern = false)', () => {
        item.persist({ followCollectionPersistKeyPattern: false });

        expect(State.prototype.persist).toHaveBeenCalledWith(item._key, {
          loadValue: true,
          storageKeys: [],
          defaultStorageKey: null,
        });
      });

      it('should persist Item with specified key (config.followCollectionPersistKeyPattern = false)', () => {
        item.persist('dummyKey', { followCollectionPersistKeyPattern: false });

        expect(State.prototype.persist).toHaveBeenCalledWith('dummyKey', {
          loadValue: true,
          storageKeys: [],
          defaultStorageKey: null,
        });
      });
    });

    describe('addRebuildGroupThatIncludeItemKeySideEffect function tests', () => {
      beforeEach(() => {
        dummyCollection.rebuildGroupsThatIncludeItemKey = jest.fn();
        jest.spyOn(item, 'addSideEffect');
      });

      it('should add rebuildGroupThatIncludeItemKey sideEffect to Item', () => {
        item.addRebuildGroupThatIncludeItemKeySideEffect('itemKey');

        expect(
          item.addSideEffect
        ).toHaveBeenCalledWith(
          Item.updateGroupSideEffectKey,
          expect.any(Function),
          { weight: 100 }
        );
      });

      describe('test added sideEffect called Item.updateGroupSideEffectKey', () => {
        beforeEach(() => {
          dummyCollection.rebuildGroupsThatIncludeItemKey = jest.fn();
        });

        it('should call rebuildGroupThatIncludeItemKey', () => {
          item.addRebuildGroupThatIncludeItemKeySideEffect('itemKey');

          item.sideEffects[Item.updateGroupSideEffectKey].callback(item, {
            dummy: 'property',
          });

          expect(
            dummyCollection.rebuildGroupsThatIncludeItemKey
          ).toHaveBeenCalledWith('itemKey', { dummy: 'property' });
        });
      });
    });
  });
});
