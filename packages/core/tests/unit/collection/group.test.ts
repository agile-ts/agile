import {
  Group,
  Agile,
  Collection,
  StateObserver,
  ComputedTracker,
  Item,
  State,
  CollectionPersistent,
} from '../../../src';
import mockConsole from 'jest-mock-console';

describe('Group Tests', () => {
  interface ItemInterface {
    id: string;
    name: string;
  }

  let dummyAgile: Agile;
  let dummyCollection: Collection<ItemInterface>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockConsole(['error', 'warn']);

    dummyAgile = new Agile({ localStorage: false });
    dummyCollection = new Collection<ItemInterface>(dummyAgile, {
      key: 'dummyCollection',
    });

    jest.spyOn(Group.prototype, 'rebuild');
    jest.spyOn(Group.prototype, 'addSideEffect');
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
    expect(group._items).toStrictEqual([]);
    expect(group.notFoundItemKeys).toStrictEqual([]);

    expect(group._key).toBeUndefined();
    expect(group.valueType).toBeUndefined();
    expect(group.isSet).toBeFalsy();
    expect(group.isPlaceholder).toBeFalsy();
    expect(group.initialStateValue).toStrictEqual([]);
    expect(group._value).toStrictEqual([]);
    expect(group.previousStateValue).toStrictEqual([]);
    expect(group.nextStateValue).toStrictEqual([]);
    expect(group.observer).toBeInstanceOf(StateObserver);
    expect(group.observer.dependents.size).toBe(0);
    expect(group.observer._key).toBeUndefined();
    expect(group.sideEffects).toStrictEqual({});
    expect(group.computeValueMethod).toBeUndefined();
    expect(group.computeExistsMethod).toBeInstanceOf(Function);
    expect(group.isPersisted).toBeFalsy();
    expect(group.persistent).toBeUndefined();
    expect(group.watchers).toStrictEqual({});
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
    expect(group._items).toStrictEqual([]);
    expect(group.notFoundItemKeys).toStrictEqual([]);

    expect(group._key).toBe('dummyKey');
    expect(group.valueType).toBeUndefined();
    expect(group.isSet).toBeFalsy();
    expect(group.isPlaceholder).toBeTruthy();
    expect(group.initialStateValue).toStrictEqual([]);
    expect(group._value).toStrictEqual([]);
    expect(group.previousStateValue).toStrictEqual([]);
    expect(group.nextStateValue).toStrictEqual([]);
    expect(group.observer).toBeInstanceOf(StateObserver);
    expect(group.observer.dependents.size).toBe(0);
    expect(group.observer._key).toBe('dummyKey');
    expect(group.sideEffects).toStrictEqual({});
    expect(group.computeValueMethod).toBeUndefined();
    expect(group.computeExistsMethod).toBeInstanceOf(Function);
    expect(group.isPersisted).toBeFalsy();
    expect(group.persistent).toBeUndefined();
    expect(group.watchers).toStrictEqual({});
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
    expect(group._items).toStrictEqual([]);
    expect(group.notFoundItemKeys).toStrictEqual([]);

    expect(group._key).toBeUndefined();
    expect(group.valueType).toBeUndefined();
    expect(group.isSet).toBeFalsy();
    expect(group.isPlaceholder).toBeFalsy();
    expect(group.initialStateValue).toStrictEqual(['test1', 'test2', 'test3']);
    expect(group._value).toStrictEqual(['test1', 'test2', 'test3']);
    expect(group.previousStateValue).toStrictEqual(['test1', 'test2', 'test3']);
    expect(group.nextStateValue).toStrictEqual(['test1', 'test2', 'test3']);
    expect(group.observer).toBeInstanceOf(StateObserver);
    expect(group.observer.dependents.size).toBe(0);
    expect(group.observer._key).toBeUndefined();
    expect(group.sideEffects).toStrictEqual({});
    expect(group.computeValueMethod).toBeUndefined();
    expect(group.computeExistsMethod).toBeInstanceOf(Function);
    expect(group.isPersisted).toBeFalsy();
    expect(group.persistent).toBeUndefined();
    expect(group.watchers).toStrictEqual({});
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
        expect(ComputedTracker.tracked).toHaveBeenCalledWith(group.observer);
      });
    });

    describe('output set function tests', () => {
      it('should set output to passed value', () => {
        group.output = [
          { id: '12', name: 'Hans der 3' },
          { id: '99', name: 'Frank' },
        ];

        expect(group._output).toStrictEqual([
          { id: '12', name: 'Hans der 3' },
          { id: '99', name: 'Frank' },
        ]);
      });
    });

    describe('item get function tests', () => {
      beforeEach(() => {
        jest.spyOn(ComputedTracker, 'tracked');
      });

      it('should return items of Group and call ComputedTracker.tracked', () => {
        group._items = [() => dummyItem1, () => dummyItem2];

        const response = group.items;

        expect(response).toStrictEqual([dummyItem1, dummyItem2]);
        expect(ComputedTracker.tracked).toHaveBeenCalledWith(group.observer);
      });
    });

    describe('item set function tests', () => {
      it('should set items to passed value', () => {
        group.items = [dummyItem1, dummyItem2];

        expect(group._items.length).toBe(2);
        expect(group._items[0]()).toBe(dummyItem1);
        expect(group._items[1]()).toBe(dummyItem2);
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

      it('should remove Item from Group not in background (default config)', () => {
        group.remove('dummyItem1Key');

        expect(console.error).not.toHaveBeenCalled();
        expect(group.set).toHaveBeenCalledWith(
          ['dummyItem2Key', 'dummyItem3Key'],
          {}
        );
      });

      it('should remove Item from Group in background (config.background = true)', () => {
        group.remove('dummyItem1Key', { background: true });

        expect(console.error).not.toHaveBeenCalled();
        expect(group.set).toHaveBeenCalledWith(
          ['dummyItem2Key', 'dummyItem3Key'],
          { background: true }
        );
      });

      it("shouldn't remove not existing Item from Group (default config)", () => {
        group.remove('notExistingKey');

        expect(console.error).toHaveBeenCalledWith(
          "Agile Error: Couldn't find ItemKey 'notExistingKey' in Group 'groupKey'!"
        );
        expect(group.set).not.toHaveBeenCalled();
      });

      it("should remove Item from Group that doesn't exist in Collection in background (default config)", () => {
        group.remove('dummyItem3Key');

        expect(console.error).not.toHaveBeenCalled();
        expect(group.set).toHaveBeenCalledWith(
          ['dummyItem1Key', 'dummyItem2Key'],
          { background: true }
        );
      });

      it('should remove Items from Group not in background (default config)', () => {
        group.remove(['dummyItem1Key', 'notExistingItemKey', 'dummyItem3Key']);

        expect(console.error).toHaveBeenCalledWith(
          "Agile Error: Couldn't find ItemKey 'notExistingItemKey' in Group 'groupKey'!"
        );
        expect(group.set).toHaveBeenCalledWith(['dummyItem2Key'], {});
      });

      it("should remove Items from Group in background if passing not existing Item and Item that doesn't exist in Collection (default config)", () => {
        group.remove(['notExistingItemKey', 'dummyItem3Key']);

        expect(console.error).toHaveBeenCalledWith(
          "Agile Error: Couldn't find ItemKey 'notExistingItemKey' in Group 'groupKey'!"
        );
        expect(group.set).toHaveBeenCalledWith(
          ['dummyItem1Key', 'dummyItem2Key'],
          { background: true }
        );
      });
    });

    describe('add function tests', () => {
      beforeEach(() => {
        group.nextStateValue = ['placeholder', 'dummyItem1Key', 'placeholder'];
        group.set = jest.fn();
      });

      it('should add Item to Group at the end not in background (default config)', () => {
        group.add('dummyItem2Key');

        expect(group.set).toHaveBeenCalledWith(
          ['placeholder', 'dummyItem1Key', 'placeholder', 'dummyItem2Key'],
          {}
        );
      });

      it("should add Item to Group at the beginning not in background (config.method = 'unshift')", () => {
        group.add('dummyItem2Key', { method: 'unshift' });

        expect(group.set).toHaveBeenCalledWith(
          ['dummyItem2Key', 'placeholder', 'dummyItem1Key', 'placeholder'],
          {}
        );
      });

      it('should add Item to Group at the end in background (config.background = true)', () => {
        group.add('dummyItem2Key', { background: true });

        expect(group.set).toHaveBeenCalledWith(
          ['placeholder', 'dummyItem1Key', 'placeholder', 'dummyItem2Key'],
          { background: true }
        );
      });

      it("should add Item to Group at the end that doesn't exist in Collection in background (default config)", () => {
        group.add('dummyItem3Key');

        expect(group.set).toHaveBeenCalledWith(
          ['placeholder', 'dummyItem1Key', 'placeholder', 'dummyItem3Key'],
          { background: true }
        );
      });

      it("shouldn't add existing Item to Group again (default config)", () => {
        group.add('dummyItem1Key');

        expect(group.set).not.toHaveBeenCalled();
      });

      it('should remove existingItem and add it again at the end to the Group not in background (config.overwrite = true)', () => {
        group.add('dummyItem1Key', { overwrite: true });

        expect(group.set).toHaveBeenCalledWith(
          ['placeholder', 'placeholder', 'dummyItem1Key'],
          {}
        );
      });

      it('should add Items to Group at the end not in background (default config)', () => {
        group.add(['dummyItem1Key', 'dummyItem2Key', 'dummyItem3Key']);

        expect(group.set).toHaveBeenCalledWith(
          [
            'placeholder',
            'dummyItem1Key',
            'placeholder',
            'dummyItem2Key',
            'dummyItem3Key',
          ],
          {}
        );
      });

      it('should add Items toGroup at the end in background if passing existing Item and in Collection not existing Item (default config)', () => {
        group.add(['dummyItem1Key', 'dummyItem3Key']);

        expect(group.set).toHaveBeenCalledWith(
          ['placeholder', 'dummyItem1Key', 'placeholder', 'dummyItem3Key'],
          { background: true }
        );
      });
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

    describe('persist function tests', () => {
      beforeEach(() => {
        jest.spyOn(State.prototype, 'persist');
      });

      it('should persist Group with GroupKey (default config)', () => {
        group.persist();

        expect(State.prototype.persist).toHaveBeenCalledWith(group._key, {
          instantiate: true,
          storageKeys: [],
        });
      });

      it('should persist Group with GroupKey (specific config)', () => {
        group.persist({ instantiate: false, storageKeys: ['test1', 'test2'] });

        expect(State.prototype.persist).toHaveBeenCalledWith(group._key, {
          instantiate: false,
          storageKeys: ['test1', 'test2'],
        });
      });

      it('should persist Group with passed Key (default config)', () => {
        group.persist('dummyKey');

        expect(State.prototype.persist).toHaveBeenCalledWith('dummyKey', {
          instantiate: true,
          storageKeys: [],
        });
      });

      it('should persist Group with passed Key (specific config)', () => {
        group.persist('dummyKey', {
          instantiate: false,
          storageKeys: ['test1', 'test2'],
        });

        expect(State.prototype.persist).toHaveBeenCalledWith('dummyKey', {
          instantiate: false,
          storageKeys: ['test1', 'test2'],
        });
      });

      it('should persist Group with formatted GroupKey (config.followCollectionPersistKeyPattern)', () => {
        group.persist({ followCollectionPersistKeyPattern: true });

        expect(State.prototype.persist).toHaveBeenCalledWith(
          CollectionPersistent.getGroupStorageKey(
            group._key,
            dummyCollection._key
          ),
          {
            instantiate: true,
            storageKeys: [],
          }
        );
      });

      it('should persist Group with formatted passed Key (config.followCollectionPersistKeyPattern)', () => {
        group.persist('dummyKey', { followCollectionPersistKeyPattern: true });

        expect(State.prototype.persist).toHaveBeenCalledWith(
          CollectionPersistent.getGroupStorageKey(
            'dummyKey',
            dummyCollection._key
          ),
          {
            instantiate: true,
            storageKeys: [],
          }
        );
      });
    });

    describe('rebuild function tests', () => {
      beforeEach(() => {
        group._value = ['dummyItem1Key', 'dummyItem3Key', 'dummyItem2Key'];
      });

      it('should build Group output and items and set notFoundItemKeys to not found Item Keys', () => {
        group.rebuild();

        expect(
          console.warn
        ).toHaveBeenCalledWith(
          `Agile Warn: Couldn't find some Items in Collection '${dummyCollection._key}' (${group._key})`,
          ['dummyItem3Key']
        );
        expect(group.notFoundItemKeys).toStrictEqual(['dummyItem3Key']);
        expect(group.items).toStrictEqual([dummyItem1, dummyItem2]);
        expect(group._output).toStrictEqual([
          dummyItem1._value,
          dummyItem2._value,
        ]);
      });
    });
  });
});
