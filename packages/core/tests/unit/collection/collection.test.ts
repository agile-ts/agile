import {
  Collection,
  Agile,
  Group,
  Selector,
  Item,
  CollectionPersistent,
  ComputedTracker,
  StatePersistent,
} from '../../../src';
import * as Utils from '@agile-ts/utils';
import { LogMock } from '../../helper/logMock';

jest.mock('../../../src/collection/collection.persistent');

describe('Collection Tests', () => {
  interface ItemInterface {
    id: string;
    name: string;
  }

  let dummyAgile: Agile;

  beforeEach(() => {
    jest.clearAllMocks();
    LogMock.mockLogs();

    dummyAgile = new Agile({ localStorage: false });

    jest.spyOn(Collection.prototype, 'initSelectors');
    jest.spyOn(Collection.prototype, 'initGroups');
    jest.spyOn(Collection.prototype, 'collect');
  });

  it('should create Collection (default config)', () => {
    // Overwrite methods once to not call id
    jest
      .spyOn(Collection.prototype, 'initSelectors')
      .mockReturnValueOnce(undefined);
    jest
      .spyOn(Collection.prototype, 'initGroups')
      .mockReturnValueOnce(undefined);

    const collection = new Collection<ItemInterface>(dummyAgile);

    expect(collection.config).toStrictEqual({
      primaryKey: 'id',
      defaultGroupKey: 'default',
    });
    expect(collection.size).toBe(0);
    expect(collection.data).toStrictEqual({});
    expect(collection._key).toBeUndefined();
    expect(collection.isPersisted).toBeFalsy();
    expect(collection.persistent).toBeUndefined();
    expect(collection.groups).toStrictEqual({});
    expect(collection.selectors).toStrictEqual({});

    expect(Collection.prototype.initGroups).toHaveBeenCalledWith({});
    expect(Collection.prototype.initSelectors).toHaveBeenCalledWith({});
    expect(Collection.prototype.collect).not.toHaveBeenCalled();
  });

  it('should create Collection (specific config)', () => {
    // Overwrite methods once to not call id
    jest
      .spyOn(Collection.prototype, 'initSelectors')
      .mockReturnValueOnce(undefined);
    jest
      .spyOn(Collection.prototype, 'initGroups')
      .mockReturnValueOnce(undefined);
    jest
      .spyOn(Collection.prototype, 'collect')
      .mockReturnValueOnce(undefined as any);

    const collection = new Collection<ItemInterface>(dummyAgile, {
      defaultGroupKey: 'general',
      groups: ['group1', 'group2'],
      selectors: ['selector1', 'selector2'],
      key: 'dummyCollectionKey',
      primaryKey: 'key',
      initialData: [{ id: '1', name: 'jeff' }],
    });

    expect(collection.config).toStrictEqual({
      primaryKey: 'key',
      defaultGroupKey: 'general',
    });
    expect(collection.size).toBe(0);
    expect(collection.data).toStrictEqual({});
    expect(collection._key).toBe('dummyCollectionKey');
    expect(collection.isPersisted).toBeFalsy();
    expect(collection.persistent).toBeUndefined();
    expect(collection.groups).toStrictEqual({});
    expect(collection.selectors).toStrictEqual({});

    expect(Collection.prototype.initGroups).toHaveBeenCalledWith([
      'group1',
      'group2',
    ]);
    expect(Collection.prototype.initSelectors).toHaveBeenCalledWith([
      'selector1',
      'selector2',
    ]);
    expect(Collection.prototype.collect).toHaveBeenCalledWith([
      { id: '1', name: 'jeff' },
    ]);
  });

  it('should create Collection (specific config in function form)', () => {
    // Overwrite methods once to not call id
    jest
      .spyOn(Collection.prototype, 'initSelectors')
      .mockReturnValueOnce(undefined);
    jest
      .spyOn(Collection.prototype, 'initGroups')
      .mockReturnValueOnce(undefined);
    jest
      .spyOn(Collection.prototype, 'collect')
      .mockReturnValueOnce(undefined as any);

    const collection = new Collection<ItemInterface>(
      dummyAgile,
      (collection) => ({
        defaultGroupKey: 'general',
        groups: {
          group1: collection.Group(),
        },
        selectors: {
          selector1: collection.Selector('id1'),
        },
        key: 'dummyCollectionKey',
        primaryKey: 'key',
        initialData: [{ id: '1', name: 'jeff' }],
      })
    );

    expect(collection.config).toStrictEqual({
      primaryKey: 'key',
      defaultGroupKey: 'general',
    });
    expect(collection.size).toBe(0);
    expect(collection.data).toStrictEqual({});
    expect(collection._key).toBe('dummyCollectionKey');
    expect(collection.isPersisted).toBeFalsy();
    expect(collection.persistent).toBeUndefined();
    expect(collection.groups).toStrictEqual({});
    expect(collection.selectors).toStrictEqual({});

    expect(Collection.prototype.initGroups).toHaveBeenCalledWith({
      group1: expect.any(Group),
    });
    expect(Collection.prototype.initSelectors).toHaveBeenCalledWith({
      selector1: expect.any(Selector),
    });
    expect(Collection.prototype.collect).toHaveBeenCalledWith([
      { id: '1', name: 'jeff' },
    ]);
  });

  it('should call reselect on Selectors but not rebuild on Groups after the Collection instantiation (specific config in function form)', () => {
    jest
      .spyOn(Selector.prototype, 'reselect')
      .mockReturnValueOnce(undefined as any);
    jest
      .spyOn(Group.prototype, 'rebuild')
      .mockReturnValueOnce(undefined as any);

    new Collection<ItemInterface>(dummyAgile, (collection) => ({
      groups: {
        group1: collection.Group(),
      },
      selectors: {
        selector1: collection.Selector('id1'),
      },
    }));

    expect(Selector.prototype.reselect).toHaveBeenCalledTimes(1);
    expect(Group.prototype.rebuild).toHaveBeenCalledTimes(2); // +1 in the creation of 'group1' Group and +1 in the creation of default Group
  });

  describe('Collection Function Tests', () => {
    let collection: Collection<ItemInterface>;

    beforeEach(() => {
      collection = new Collection(dummyAgile, { key: 'collectionKey' });
    });

    it('should call setKey with passed value', () => {
      collection.setKey = jest.fn();

      collection.key = 'newKey';

      expect(collection.setKey).toHaveBeenCalledWith('newKey');
    });

    describe('key get function tests', () => {
      it('should return current State Key', () => {
        expect(collection.key).toBe('collectionKey');
      });
    });

    describe('setKey function tests', () => {
      beforeEach(() => {
        collection.persistent = new CollectionPersistent(collection);

        collection.persistent.setKey = jest.fn();
      });

      it('should update existing Key in all instances', () => {
        if (collection.persistent) collection.persistent._key = 'collectionKey';

        collection.setKey('newKey');

        expect(collection._key).toBe('newKey');
        expect(collection.persistent?.setKey).toHaveBeenCalledWith('newKey');
      });

      it("should update existing Key in all instances except persistent if the CollectionKey and PersistKey aren't equal", () => {
        if (collection.persistent) collection.persistent._key = 'randomKey';

        collection.setKey('newKey');

        expect(collection._key).toBe('newKey');
        expect(collection.persistent?.setKey).not.toHaveBeenCalled();
      });

      it('should update existing Key in all instances except persistent if new CollectionKey is undefined', () => {
        if (collection.persistent) collection.persistent._key = 'collectionKey';

        collection.setKey(undefined);

        expect(collection._key).toBeUndefined();
        expect(collection.persistent?.setKey).not.toHaveBeenCalled();
      });
    });

    describe('Group function tests', () => {
      beforeEach(() => {
        jest.spyOn(collection, 'createGroup');
      });

      it('should create Group with key which belongs to Collection before instantiation', () => {
        collection.isInstantiated = false;
        const response = collection.Group([1, 2], {
          key: 'group1Key',
        });

        expect(collection.createGroup).not.toHaveBeenCalled();
        LogMock.hasNotLogged('warn');

        expect(response).toBeInstanceOf(Group);
        expect(response._key).toBe('group1Key');
        expect(response._value).toStrictEqual([1, 2]);
        expect(response.collection()).toBe(collection);
      });

      it('should create Group with key which belongs to Collection after instantiation and print warning', () => {
        collection.isInstantiated = true;
        const response = collection.Group([1, 2], {
          key: 'group1Key',
        });

        expect(collection.createGroup).toHaveBeenCalledWith('group1Key', [
          1,
          2,
        ]);
        LogMock.hasLoggedCode('1B:02:00');

        expect(response).toBeInstanceOf(Group);
        expect(response._key).toBe('group1Key');
        expect(response._value).toStrictEqual([1, 2]);
        expect(response.collection()).toBe(collection);
      });

      it('should create Group with no key which belongs to Collection after instantiation and print warning', () => {
        jest.spyOn(Utils, 'generateId').mockReturnValueOnce('randomId');

        collection.isInstantiated = true;
        const response = collection.Group([1, 2]);

        LogMock.hasLoggedCode('1B:02:00');

        expect(response).toBeInstanceOf(Group);
        expect(response._key).toBe('randomId');
        expect(response._value).toStrictEqual([1, 2]);
        expect(response.collection()).toBe(collection);
      });
    });

    describe('Selector function tests', () => {
      beforeEach(() => {
        jest.spyOn(collection, 'createSelector');
      });

      it('should create Selector with key which belongs to Collection before instantiation', () => {
        collection.isInstantiated = false;
        const response = collection.Selector(1, {
          key: 'selectorKey1',
        });

        expect(collection.createSelector).not.toHaveBeenCalled();
        LogMock.hasNotLogged('warn');

        expect(response).toBeInstanceOf(Selector);
        expect(response._key).toBe('selectorKey1');
        expect(response._itemKey).toStrictEqual(1);
        expect(response.collection()).toBe(collection);
      });

      it('should create Selector with key which belongs to Collection after instantiation and print warning', () => {
        collection.isInstantiated = true;
        const response = collection.Selector(1, {
          key: 'selectorKey1',
        });

        expect(collection.createSelector).toHaveBeenCalledWith(
          'selectorKey1',
          1
        );
        LogMock.hasLoggedCode('1B:02:01');

        expect(response).toBeInstanceOf(Selector);
        expect(response._key).toBe('selectorKey1');
        expect(response._itemKey).toStrictEqual(1);
        expect(response.collection()).toBe(collection);
      });

      it('should create Selector with no key which belongs to Collection after instantiation and print warning', () => {
        jest.spyOn(Utils, 'generateId').mockReturnValueOnce('randomId');

        collection.isInstantiated = true;
        const response = collection.Selector(1);

        LogMock.hasLoggedCode('1B:02:01');

        expect(response).toBeInstanceOf(Selector);
        expect(response._key).toBe('randomId');
        expect(response._itemKey).toStrictEqual(1);
        expect(response.collection()).toBe(collection);
      });
    });

    describe('initGroups function tests', () => {
      it('should create GroupsObject out of passed GroupKeys Array and add defaultGroup', () => {
        collection.initGroups(['group1', 'group2']);

        expect(collection.groups).toHaveProperty('group1');
        expect(collection.groups['group1']._key).toBe('group1');
        expect(collection.groups['group1']._value).toStrictEqual([]);
        expect(collection.groups['group1'].collection()).toBe(collection);

        expect(collection.groups).toHaveProperty('group2');
        expect(collection.groups['group2']._key).toBe('group2');
        expect(collection.groups['group2']._value).toStrictEqual([]);
        expect(collection.groups['group2'].collection()).toBe(collection);

        expect(collection.groups).toHaveProperty(
          collection.config.defaultGroupKey as any
        );
        expect(collection.groups[collection.config.defaultGroupKey]._key).toBe(
          'default'
        );
        expect(
          collection.groups[collection.config.defaultGroupKey]._value
        ).toStrictEqual([]);
        expect(
          collection.groups[collection.config.defaultGroupKey].collection()
        ).toBe(collection);
      });

      it('should create GroupsObject out of passed Groups Object and add default Group', () => {
        const dummyGroup1 = new Group(collection);
        const dummyGroup2 = new Group(collection, ['test1', 'test2'], {
          key: 'overwrittenKey',
        });

        collection.initGroups({
          dummyGroup1: dummyGroup1,
          dummyGroup2: dummyGroup2,
        });

        expect(collection.groups).toHaveProperty('dummyGroup1');
        expect(collection.groups['dummyGroup1']._key).toBe('dummyGroup1');
        expect(collection.groups['dummyGroup1']._value).toStrictEqual([]);
        expect(collection.groups['dummyGroup1'].collection()).toBe(collection);

        expect(collection.groups).toHaveProperty('dummyGroup2');
        expect(collection.groups['dummyGroup2']._key).toBe('overwrittenKey');
        expect(collection.groups['dummyGroup2']._value).toStrictEqual([
          'test1',
          'test2',
        ]);
        expect(collection.groups['dummyGroup2'].collection()).toBe(collection);

        expect(collection.groups).toHaveProperty(
          collection.config.defaultGroupKey as any
        );
        expect(collection.groups[collection.config.defaultGroupKey]._key).toBe(
          'default'
        );
        expect(
          collection.groups[collection.config.defaultGroupKey]._value
        ).toStrictEqual([]);
        expect(
          collection.groups[collection.config.defaultGroupKey].collection()
        ).toBe(collection);
      });
    });

    describe('initSelectors function tests', () => {
      it('should create SelectorsObject out of passed SelectorKeys Array', () => {
        collection.initSelectors(['selector1', 'selector2']);

        expect(collection.selectors).toHaveProperty('selector1');
        expect(collection.selectors['selector1']._key).toBe('selector1');
        expect(collection.selectors['selector1']._itemKey).toBe('selector1');
        expect(collection.selectors['selector1'].collection()).toBe(collection);

        expect(collection.selectors).toHaveProperty('selector2');
        expect(collection.selectors['selector2']._key).toBe('selector2');
        expect(collection.selectors['selector2']._itemKey).toBe('selector2');
        expect(collection.selectors['selector2'].collection()).toBe(collection);
      });

      it('should create SelectorsObject out of passed Selector Object', () => {
        const dummySelector1 = new Selector(collection, '1');
        const dummySelector2 = new Selector(collection, '2', {
          key: 'overwrittenKey',
        });

        collection.initSelectors({
          dummySelector1: dummySelector1,
          dummySelector2: dummySelector2,
        });

        expect(collection.selectors).toHaveProperty('dummySelector1');
        expect(collection.selectors['dummySelector1']._key).toBe(
          'dummySelector1'
        );
        expect(collection.selectors['dummySelector1']._itemKey).toBe('1');
        expect(collection.selectors['dummySelector1'].collection()).toBe(
          collection
        );

        expect(collection.selectors).toHaveProperty('dummySelector2');
        expect(collection.selectors['dummySelector2']._key).toBe(
          'overwrittenKey'
        );
        expect(collection.selectors['dummySelector2']._itemKey).toBe('2');
        expect(collection.selectors['dummySelector2'].collection()).toBe(
          collection
        );
      });
    });

    describe('collect function tests', () => {
      let dummyGroup1: Group<ItemInterface>;
      let dummyGroup2: Group<ItemInterface>;
      let defaultGroup: Group<ItemInterface>;

      beforeEach(() => {
        dummyGroup1 = new Group(collection);
        dummyGroup2 = new Group(collection);
        defaultGroup = new Group(collection);

        collection.groups = {
          [collection.config.defaultGroupKey]: defaultGroup,
          dummyGroup1: dummyGroup1,
          dummyGroup2: dummyGroup2,
        };

        collection.setData = jest.fn();
        collection.createSelector = jest.fn();
        collection.createGroup = jest.fn();

        dummyGroup1.add = jest.fn();
        dummyGroup2.add = jest.fn();
        defaultGroup.add = jest.fn();
      });

      it('should add Data to Collection and to default Group (default config)', () => {
        collection.setData = jest.fn(() => true);

        collection.collect({ id: '1', name: 'frank' });

        expect(collection.setData).toHaveBeenCalledWith(
          {
            id: '1',
            name: 'frank',
          },
          {
            patch: false,
            background: false,
          }
        );
        expect(collection.createGroup).not.toHaveBeenCalled();

        expect(dummyGroup1.add).not.toHaveBeenCalled();
        expect(dummyGroup2.add).not.toHaveBeenCalled();
        expect(defaultGroup.add).toHaveBeenCalledWith('1', {
          method: 'push',
          background: false,
        });

        expect(collection.createSelector).not.toHaveBeenCalled();
      });

      it('should add Data to Collection and to default Group (specific config)', () => {
        collection.setData = jest.fn(() => true);

        collection.collect({ id: '1', name: 'frank' }, [], {
          background: true,
          method: 'unshift',
          patch: true,
        });

        expect(collection.setData).toHaveBeenCalledWith(
          {
            id: '1',
            name: 'frank',
          },
          {
            patch: true,
            background: true,
          }
        );
        expect(collection.createGroup).not.toHaveBeenCalled();

        expect(dummyGroup1.add).not.toHaveBeenCalled();
        expect(dummyGroup2.add).not.toHaveBeenCalled();
        expect(defaultGroup.add).toHaveBeenCalledWith('1', {
          method: 'unshift',
          background: true,
        });

        expect(collection.createSelector).not.toHaveBeenCalled();
      });

      it('should add Data to Collection and to passed Groups + default Group (default config)', () => {
        collection.setData = jest.fn(() => true);

        collection.collect(
          [
            { id: '1', name: 'frank' },
            { id: '2', name: 'hans' },
          ],
          ['dummyGroup1', 'dummyGroup2']
        );

        expect(collection.setData).toHaveBeenCalledWith(
          {
            id: '1',
            name: 'frank',
          },
          {
            patch: false,
            background: false,
          }
        );
        expect(collection.setData).toHaveBeenCalledWith(
          {
            id: '2',
            name: 'hans',
          },
          {
            patch: false,
            background: false,
          }
        );
        expect(collection.createGroup).not.toHaveBeenCalled();

        expect(dummyGroup1.add).toHaveBeenCalledWith('1', {
          method: 'push',
          background: false,
        });
        expect(dummyGroup1.add).toHaveBeenCalledWith('2', {
          method: 'push',
          background: false,
        });
        expect(dummyGroup2.add).toHaveBeenCalledWith('1', {
          method: 'push',
          background: false,
        });
        expect(dummyGroup2.add).toHaveBeenCalledWith('2', {
          method: 'push',
          background: false,
        });
        expect(defaultGroup.add).toHaveBeenCalledWith('1', {
          method: 'push',
          background: false,
        });
        expect(defaultGroup.add).toHaveBeenCalledWith('2', {
          method: 'push',
          background: false,
        });

        expect(collection.createSelector).not.toHaveBeenCalled();
      });

      it("should call setData and shouldn't add Items to passed Groups if setData failed (default config)", () => {
        collection.setData = jest.fn(() => false);

        collection.collect({ id: '1', name: 'frank' }, [
          'dummyGroup1',
          'dummyGroup2',
        ]);

        expect(collection.setData).toHaveBeenCalledWith(
          {
            id: '1',
            name: 'frank',
          },
          {
            patch: false,
            background: false,
          }
        );
        expect(collection.createGroup).not.toHaveBeenCalled();

        expect(dummyGroup1.add).not.toHaveBeenCalled();
        expect(dummyGroup2.add).not.toHaveBeenCalled();
        expect(defaultGroup.add).not.toHaveBeenCalled();

        expect(collection.createSelector).not.toHaveBeenCalled();
      });

      it("should add Data to Collection and create Groups that doesn't exist yet (default config)", () => {
        const notExistingGroup = new Group(collection);
        notExistingGroup.add = jest.fn();
        collection.setData = jest.fn(() => true);
        collection.createGroup = jest.fn(function (groupKey) {
          //@ts-ignore
          this.groups[groupKey] = notExistingGroup;
          return notExistingGroup as any;
        });

        collection.collect({ id: '1', name: 'frank' }, 'notExistingGroup');

        expect(collection.setData).toHaveBeenCalledWith(
          {
            id: '1',
            name: 'frank',
          },
          {
            patch: false,
            background: false,
          }
        );
        expect(collection.createGroup).toHaveBeenCalledWith('notExistingGroup');

        expect(dummyGroup1.add).not.toHaveBeenCalled();
        expect(dummyGroup2.add).not.toHaveBeenCalled();
        expect(notExistingGroup.add).toHaveBeenCalledWith('1', {
          method: 'push',
          background: false,
        });
        expect(defaultGroup.add).toHaveBeenCalledWith('1', {
          method: 'push',
          background: false,
        });

        expect(collection.createSelector).not.toHaveBeenCalled();
      });

      it('should create Selector for each Item (config.select)', () => {
        collection.setData = jest.fn(() => true);

        collection.collect(
          [
            { id: '1', name: 'frank' },
            { id: '2', name: 'hans' },
          ],
          [],
          { select: true }
        );

        expect(collection.createSelector).toHaveBeenCalledWith('1', '1');
        expect(collection.createSelector).toHaveBeenCalledWith('2', '2');
      });

      it("should call 'forEachItem' for each Item (default config)", () => {
        collection.setData = jest.fn(() => true);
        const forEachItemMock = jest.fn();

        collection.collect(
          [
            { id: '1', name: 'frank' },
            { id: '2', name: 'hans' },
          ],
          [],
          { forEachItem: forEachItemMock }
        );

        expect(forEachItemMock).toHaveBeenCalledWith(
          { id: '1', name: 'frank' },
          '1',
          0
        );
        expect(forEachItemMock).toHaveBeenCalledWith(
          { id: '2', name: 'hans' },
          '2',
          1
        );
      });
    });

    describe('update function tests', () => {
      let dummyItem: Item<ItemInterface>;

      beforeEach(() => {
        dummyItem = new Item(collection, { id: 'dummyItem', name: 'frank' });
        collection.data = {
          dummyItem: dummyItem,
        };

        dummyItem.patch = jest.fn();
        dummyItem.set = jest.fn();
        collection.updateItemKey = jest.fn();
      });

      it('should update existing Item by patching valid changes Object (default config)', () => {
        const response = collection.update('dummyItem', { name: 'hans' });

        expect(response).toBe(dummyItem);
        LogMock.hasNotLogged('error');
        LogMock.hasNotLogged('warn');
        expect(dummyItem.patch).toHaveBeenCalledWith(
          {
            name: 'hans',
          },
          {
            background: false,
            addNewProperties: true,
          }
        );
        expect(dummyItem.set).not.toHaveBeenCalled();
        expect(collection.updateItemKey).not.toHaveBeenCalled();
      });

      it('should update existing Item by patching valid changes Object (specific config)', () => {
        const response = collection.update(
          'dummyItem',
          { name: 'hans' },
          {
            background: true,
          }
        );

        expect(response).toBe(dummyItem);
        LogMock.hasNotLogged('error');
        LogMock.hasNotLogged('warn');
        expect(dummyItem.patch).toHaveBeenCalledWith(
          {
            name: 'hans',
          },
          {
            background: true,
            addNewProperties: true,
          }
        );
        expect(dummyItem.set).not.toHaveBeenCalled();
        expect(collection.updateItemKey).not.toHaveBeenCalled();
      });

      it('should update existing placeholder Item by patching valid changes Object (default config)', () => {
        dummyItem.isPlaceholder = true;

        const response = collection.update('dummyItem', { name: 'hans' });

        expect(response).toBe(dummyItem);
        LogMock.hasNotLogged('error');
        LogMock.hasNotLogged('warn');
        expect(dummyItem.patch).toHaveBeenCalledWith(
          {
            name: 'hans',
          },
          {
            background: false,
            addNewProperties: true,
          }
        );
        expect(dummyItem.set).not.toHaveBeenCalled();
        expect(collection.updateItemKey).not.toHaveBeenCalled();
      });

      it('should update existing Item by setting valid changes Object (default config)', () => {
        const response = collection.update(
          'dummyItem',
          { id: 'dummyItem', name: 'hans' },
          { patch: false }
        );

        expect(response).toBe(dummyItem);
        LogMock.hasNotLogged('error');
        LogMock.hasNotLogged('warn');
        expect(dummyItem.patch).not.toHaveBeenCalled();
        expect(dummyItem.set).toHaveBeenCalledWith(
          { id: 'dummyItem', name: 'hans' },
          { background: false }
        );
        expect(collection.updateItemKey).not.toHaveBeenCalled();
      });

      it('should update existing Item by setting valid changes Object (specific config)', () => {
        const response = collection.update(
          'dummyItem',
          { id: 'dummyItem', name: 'hans' },
          {
            patch: false,
            background: true,
          }
        );

        expect(response).toBe(dummyItem);
        LogMock.hasNotLogged('error');
        LogMock.hasNotLogged('warn');
        expect(dummyItem.patch).not.toHaveBeenCalled();
        expect(dummyItem.set).toHaveBeenCalledWith(
          { id: 'dummyItem', name: 'hans' },
          { background: true }
        );
        expect(collection.updateItemKey).not.toHaveBeenCalled();
      });

      it('should update existing Item by setting valid changes Object without primaryKey and should print warning (default config)', () => {
        const response = collection.update(
          'dummyItem',
          { name: 'hans' },
          { patch: false }
        );

        expect(response).toBe(dummyItem);
        LogMock.hasNotLogged('error');
        LogMock.hasLoggedCode('1B:02:02', [], {
          id: 'dummyItem',
          name: 'hans',
        });
        expect(dummyItem.patch).not.toHaveBeenCalled();
        expect(dummyItem.set).toHaveBeenCalledWith(
          { id: 'dummyItem', name: 'hans' },
          { background: false }
        );
        expect(collection.updateItemKey).not.toHaveBeenCalled();
      });

      it("shouldn't update not existing Item and should print error", () => {
        const response = collection.update('notExisting', { name: 'hans' });

        expect(response).toBeUndefined();
        LogMock.hasLoggedCode('1B:03:00', ['notExisting', collection._key]);
        LogMock.hasNotLogged('warn');
        expect(dummyItem.patch).not.toHaveBeenCalled();
        expect(dummyItem.set).not.toHaveBeenCalled();
        expect(collection.updateItemKey).not.toHaveBeenCalled();
      });

      it("shouldn't update existing Item with invalid changes Object and should print error", () => {
        const response = collection.update(
          'dummyItem',
          'notValidChanges' as any
        );

        expect(response).toBeUndefined();
        LogMock.hasLoggedCode('1B:03:01', ['dummyItem', collection._key]);
        LogMock.hasNotLogged('warn');
        expect(dummyItem.patch).not.toHaveBeenCalled();
        expect(dummyItem.set).not.toHaveBeenCalled();
        expect(collection.updateItemKey).not.toHaveBeenCalled();
      });

      it('should update existing Item and its ItemKey with valid changes Object if ItemKey has changed (default config)', () => {
        const response = collection.update('dummyItem', {
          id: 'newDummyItemKey',
          name: 'hans',
        });

        expect(response).toBe(dummyItem);
        LogMock.hasNotLogged('error');
        LogMock.hasNotLogged('warn');
        expect(dummyItem.patch).toHaveBeenCalledWith(
          {
            name: 'hans',
          },
          {
            background: false,
            addNewProperties: true,
          }
        );
        expect(dummyItem.set).not.toHaveBeenCalled();
        expect(collection.updateItemKey).toHaveBeenCalledWith(
          'dummyItem',
          'newDummyItemKey',
          {
            background: false,
          }
        );
      });
    });

    describe('createGroup function tests', () => {
      let dummyGroup: Group<ItemInterface>;
      let dummyItem: Item<ItemInterface>;

      beforeEach(() => {
        dummyItem = new Item(collection, { id: 'dummyItem', name: 'frank' });
        collection.data = {
          dummyItem: dummyItem,
        };

        dummyGroup = new Group(collection, [], { key: 'dummyGroup' });
        collection.groups = {
          dummyGroup: dummyGroup,
        };

        dummyGroup.set = jest.fn();
      });

      it('should create and add not existing Group to Collection', () => {
        const response = collection.createGroup('newGroup', ['dummyItem']);

        LogMock.hasNotLogged('warn');
        expect(response).toBeInstanceOf(Group);
        expect(response._key).toBe('newGroup');
        expect(response.isPlaceholder).toBeFalsy();
        expect(response._value).toStrictEqual(['dummyItem']);
        expect(collection.groups['newGroup']).toBe(response);
      });

      it("shouldn't create and add existing Group to Collection", () => {
        const response = collection.createGroup('dummyGroup', ['dummyItem']);

        LogMock.hasLoggedCode('1B:03:02', ['dummyGroup']);
        expect(response).toBe(dummyGroup);
        expect(collection.groups['dummyGroup']).toBe(dummyGroup);
        expect(dummyGroup.set).not.toHaveBeenCalled();
      });

      it('should update existing placeholder Group of Collection', () => {
        dummyGroup.isPlaceholder = true;

        const response = collection.createGroup('dummyGroup', ['dummyItem']);

        LogMock.hasNotLogged('warn');
        expect(response).toBe(dummyGroup);
        expect(collection.groups['dummyGroup']).toBe(dummyGroup);
        expect(dummyGroup.set).toHaveBeenCalledWith(['dummyItem'], {
          overwrite: true,
        });
      });
    });

    describe('hasGroup function tests', () => {
      let dummyGroup: Group<ItemInterface>;

      beforeEach(() => {
        dummyGroup = new Group(collection, []);

        collection.getGroup = jest.fn();
      });

      it('should call getGroup and return true if getGroup returns Group (default config)', () => {
        collection.getGroup = jest.fn(() => dummyGroup as any);

        const response = collection.hasGroup('test');

        expect(response).toBeTruthy();
        expect(collection.getGroup).toHaveBeenCalledWith('test', {});
      });

      it('should call getGroup and return true if getGroup returns Group (specific config)', () => {
        collection.getGroup = jest.fn(() => dummyGroup as any);

        const response = collection.hasGroup('test', { notExisting: true });

        expect(response).toBeTruthy();
        expect(collection.getGroup).toHaveBeenCalledWith('test', {
          notExisting: true,
        });
      });

      it('should call getGroup and return false if getGroup returns undefined (default config)', () => {
        collection.getGroup = jest.fn(() => undefined);

        const response = collection.hasGroup('test');

        expect(response).toBeFalsy();
        expect(collection.getGroup).toHaveBeenCalledWith('test', {});
      });
    });

    describe('getGroup function tests', () => {
      let dummyGroup: Group<ItemInterface>;

      beforeEach(() => {
        dummyGroup = new Group(collection, [], { key: 'dummyGroup' });
        collection.groups = {
          dummyGroup: dummyGroup,
        };

        ComputedTracker.tracked = jest.fn();
      });

      it('should return and track existing Group (default config)', () => {
        const response = collection.getGroup('dummyGroup');

        expect(response).toBe(dummyGroup);
        expect(ComputedTracker.tracked).toHaveBeenCalledWith(
          dummyGroup.observer
        );
      });

      it("shouldn't return and track not existing Group (default config)", () => {
        const response = collection.getGroup('notExistingGroup');

        expect(response).toBeUndefined();
        expect(ComputedTracker.tracked).not.toHaveBeenCalled();
      });

      it("shouldn't return and track existing placeholder Group (default config)", () => {
        dummyGroup.isPlaceholder = true;

        const response = collection.getGroup('dummyGroup');

        expect(response).toBeUndefined();
        expect(ComputedTracker.tracked).not.toHaveBeenCalled();
      });

      it('should return and track existing placeholder Group (config.notExisting = true)', () => {
        dummyGroup.isPlaceholder = true;

        const response = collection.getGroup('dummyGroup', {
          notExisting: true,
        });

        expect(response).toBe(dummyGroup);
        expect(ComputedTracker.tracked).toHaveBeenCalledWith(
          dummyGroup.observer
        );
      });
    });

    describe('getDefaultGroup function tests', () => {
      it('should return default Group', () => {
        jest
          .spyOn(collection, 'getGroup')
          .mockReturnValueOnce('fakeGroup' as any);
        const response = collection.getDefaultGroup();

        expect(collection.getGroup).toHaveBeenCalledWith(
          collection.config.defaultGroupKey
        );
        expect(response).toBe('fakeGroup');
      });
    });

    describe('getGroupWithReference function tests', () => {
      let dummyGroup: Group<ItemInterface>;

      beforeEach(() => {
        dummyGroup = new Group(collection, [], { key: 'dummyGroup' });
        collection.groups = {
          dummyGroup: dummyGroup,
        };

        ComputedTracker.tracked = jest.fn();
      });

      it('should return and track existing Group', () => {
        const response = collection.getGroupWithReference('dummyGroup');

        expect(response).toBe(dummyGroup);
        expect(ComputedTracker.tracked).toHaveBeenCalledWith(
          dummyGroup.observer
        );
      });

      it("should return and track created reference Group if Group doesn't exist yet", () => {
        const response = collection.getGroupWithReference('notExistingGroup');

        expect(response).toBeInstanceOf(Group);
        expect(response.isPlaceholder).toBeTruthy();
        expect(response._key).toBe('notExistingGroup');
        expect(collection.groups['notExistingGroup']).toBe(response);
        expect(ComputedTracker.tracked).toHaveBeenCalledWith(response.observer);
      });
    });

    describe('removeGroup function tests', () => {
      let dummyGroup: Group<ItemInterface>;

      beforeEach(() => {
        dummyGroup = new Group(collection, [], { key: 'dummyGroup' });
        collection.groups = {
          dummyGroup: dummyGroup,
        };
      });

      it('should remove existing Group', () => {
        collection.removeGroup('dummyGroup');

        expect(collection.groups['dummyGroup']).toBeUndefined();
      });

      it("shouldn't remove not existing Group and print warning", () => {
        collection.removeGroup('notExistingGroup');

        expect(collection.groups).toHaveProperty('dummyGroup');
      });
    });

    describe('createSelector function tests', () => {
      let dummySelector: Selector<ItemInterface>;
      let dummyItem: Item<ItemInterface>;

      beforeEach(() => {
        dummyItem = new Item(collection, { id: 'dummyItem', name: 'frank' });
        collection.data = {
          dummyItem: dummyItem,
        };

        dummySelector = new Selector(collection, 'dummyItem', {
          key: 'dummySelector',
        });
        collection.selectors = {
          dummySelector: dummySelector,
        };

        dummySelector.select = jest.fn();
      });

      it('should create and add not existing Selector to Collection', () => {
        const response = collection.createSelector('newSelector', 'dummyItem');

        LogMock.hasNotLogged('warn');
        expect(response).toBeInstanceOf(Selector);
        expect(response._key).toBe('newSelector');
        expect(response.isPlaceholder).toBeFalsy();
        expect(response._itemKey).toStrictEqual('dummyItem');
        expect(collection.selectors['newSelector']).toBe(response);
      });

      it("shouldn't create and add existing Selector to Collection", () => {
        const response = collection.createSelector(
          'dummySelector',
          'dummyItem'
        );

        LogMock.hasLoggedCode('1B:03:03', ['dummySelector']);
        expect(response).toBe(dummySelector);
        expect(collection.selectors['dummySelector']).toBe(dummySelector);
        expect(dummySelector.select).not.toHaveBeenCalled();
      });

      it('should update existing placeholder Selector of Collection', () => {
        dummySelector.isPlaceholder = true;

        const response = collection.createSelector(
          'dummySelector',
          'dummyItem'
        );

        LogMock.hasNotLogged('warn');
        expect(response).toBe(dummySelector);
        expect(collection.selectors['dummySelector']).toBe(dummySelector);
        expect(dummySelector.select).toHaveBeenCalledWith('dummyItem', {
          overwrite: true,
        });
      });
    });

    describe('hasSelector function tests', () => {
      let dummySelector: Selector<ItemInterface>;

      beforeEach(() => {
        dummySelector = new Selector(collection, 'unknown');

        collection.getSelector = jest.fn();
      });

      it('should call getSelector and return true if getSelector returns Selector (default config)', () => {
        collection.getSelector = jest.fn(() => dummySelector as any);

        const response = collection.hasSelector('test');

        expect(response).toBeTruthy();
        expect(collection.getSelector).toHaveBeenCalledWith('test', {});
      });

      it('should call getSelector and return true if getSelector returns Selector (specific config)', () => {
        collection.getSelector = jest.fn(() => dummySelector as any);

        const response = collection.hasSelector('test', { notExisting: true });

        expect(response).toBeTruthy();
        expect(collection.getSelector).toHaveBeenCalledWith('test', {
          notExisting: true,
        });
      });

      it('should call getSelector and return false if getSelector returns undefined (default config)', () => {
        collection.getSelector = jest.fn(() => undefined);

        const response = collection.hasSelector('test');

        expect(response).toBeFalsy();
        expect(collection.getSelector).toHaveBeenCalledWith('test', {});
      });
    });

    describe('getSelector function tests', () => {
      let dummySelector: Selector<ItemInterface>;

      beforeEach(() => {
        dummySelector = new Selector(collection, 'dummyItem', {
          key: 'dummySelector',
        });
        collection.selectors = {
          dummySelector: dummySelector,
        };

        ComputedTracker.tracked = jest.fn();
      });

      it('should return and track existing Selector (default config)', () => {
        const response = collection.getSelector('dummySelector');

        expect(response).toBe(dummySelector);
        expect(ComputedTracker.tracked).toHaveBeenCalledWith(
          dummySelector.observer
        );
      });

      it("shouldn't return and track not existing Selector (default config)", () => {
        const response = collection.getSelector('notExistingSelector');

        expect(response).toBeUndefined();
        expect(ComputedTracker.tracked).not.toHaveBeenCalled();
      });

      it("shouldn't return and track existing placeholder Selector (default config)", () => {
        dummySelector.isPlaceholder = true;

        const response = collection.getSelector('dummySelector');

        expect(response).toBeUndefined();
        expect(ComputedTracker.tracked).not.toHaveBeenCalled();
      });

      it('should return and track existing placeholder Selector (config.notExisting = true)', () => {
        dummySelector.isPlaceholder = true;

        const response = collection.getSelector('dummySelector', {
          notExisting: true,
        });

        expect(response).toBe(dummySelector);
        expect(ComputedTracker.tracked).toHaveBeenCalledWith(
          dummySelector.observer
        );
      });
    });

    describe('getSelectorWithReference function tests', () => {
      let dummySelector: Selector<ItemInterface>;

      beforeEach(() => {
        dummySelector = new Selector(collection, 'dummyItem', {
          key: 'dummySelector',
        });
        collection.selectors = {
          dummySelector: dummySelector,
        };

        ComputedTracker.tracked = jest.fn();
      });

      it('should return and track existing Selector', () => {
        const response = collection.getSelectorWithReference('dummySelector');

        expect(response).toBe(dummySelector);
        expect(ComputedTracker.tracked).toHaveBeenCalledWith(
          dummySelector.observer
        );
      });

      it("should return and track created reference Selector if Selector doesn't exist yet", () => {
        const response = collection.getSelectorWithReference(
          'notExistingSelector'
        );

        expect(response).toBeInstanceOf(Selector);
        expect(response.isPlaceholder).toBeTruthy();
        expect(response._key).toBe('notExistingSelector');
        expect(collection.selectors['notExistingSelector']).toBe(response);
        expect(ComputedTracker.tracked).toHaveBeenCalledWith(response.observer);
      });
    });

    describe('removeSelector function tests', () => {
      let dummySelector: Selector<ItemInterface>;

      beforeEach(() => {
        dummySelector = new Selector(collection, 'dummyItem', {
          key: 'dummySelector',
        });
        collection.selectors = {
          dummySelector: dummySelector,
        };

        dummySelector.unselect = jest.fn();
      });

      it('should remove existing Selector', () => {
        collection.removeSelector('dummySelector');

        expect(collection.selectors).not.toHaveProperty('dummySelector');
        expect(dummySelector.unselect).toHaveBeenCalled();
      });

      it("shouldn't remove not existing Selector and print warning", () => {
        collection.removeSelector('notExistingSelector');

        expect(collection.selectors).toHaveProperty('dummySelector');
        expect(dummySelector.unselect).not.toHaveBeenCalled();
      });
    });

    describe('hasItem function tests', () => {
      let dummyItem: Item<ItemInterface>;

      beforeEach(() => {
        dummyItem = new Item(collection, { id: '1', name: 'Jeff' });

        collection.getItem = jest.fn();
      });

      it('should call getItem and return true if getItem returns Item (default config)', () => {
        collection.getItem = jest.fn(() => dummyItem);

        const response = collection.hasItem('test');

        expect(response).toBeTruthy();
        expect(collection.getItem).toHaveBeenCalledWith('test', {});
      });

      it('should call getItem and return true if getItem returns Item (specific config)', () => {
        collection.getItem = jest.fn(() => dummyItem);

        const response = collection.hasItem('test', { notExisting: true });

        expect(response).toBeTruthy();
        expect(collection.getItem).toHaveBeenCalledWith('test', {
          notExisting: true,
        });
      });

      it('should call getItem and return false if getItem returns undefined (default config)', () => {
        collection.getItem = jest.fn(() => undefined);

        const response = collection.hasItem('test');

        expect(response).toBeFalsy();
        expect(collection.getItem).toHaveBeenCalledWith('test', {});
      });
    });

    describe('getItem function tests', () => {
      let dummyItem: Item<ItemInterface>;

      beforeEach(() => {
        dummyItem = new Item(collection, { id: '1', name: 'Jeff' });
        collection.data = {
          ['1']: dummyItem,
        };

        ComputedTracker.tracked = jest.fn();
      });

      it('should return and track existing Item (default config)', () => {
        const response = collection.getItem('1');

        expect(response).toBe(dummyItem);
        expect(ComputedTracker.tracked).toHaveBeenCalledWith(
          dummyItem.observer
        );
      });

      it("shouldn't return and track not existing Item (default config)", () => {
        const response = collection.getItem('notExistingItem');

        expect(response).toBeUndefined();
        expect(ComputedTracker.tracked).not.toHaveBeenCalled();
      });

      it("shouldn't return and track existing placeholder Item (default config)", () => {
        dummyItem.isPlaceholder = true;

        const response = collection.getItem('1');

        expect(response).toBeUndefined();
        expect(ComputedTracker.tracked).not.toHaveBeenCalled();
      });

      it('should return and track existing placeholder Item (config.notExisting = true)', () => {
        dummyItem.isPlaceholder = true;

        const response = collection.getItem('1', {
          notExisting: true,
        });

        expect(response).toBe(dummyItem);
        expect(ComputedTracker.tracked).toHaveBeenCalledWith(
          dummyItem.observer
        );
      });
    });

    describe('getItemWithReference function tests', () => {
      let dummyItem: Item<ItemInterface>;

      beforeEach(() => {
        dummyItem = new Item(collection, { id: '1', name: 'Jeff' });
        collection.data = {
          ['1']: dummyItem,
        };

        ComputedTracker.tracked = jest.fn();
      });

      it('should return and track existing Item', () => {
        const response = collection.getItemWithReference('1');

        expect(response).toBe(dummyItem);
        expect(ComputedTracker.tracked).toHaveBeenCalledWith(
          dummyItem.observer
        );
      });

      it("should return and track created reference Item if Item doesn't exist yet", () => {
        const response = collection.getItemWithReference('notExistingItem');

        expect(response).toBeInstanceOf(Item);
        expect(response.isPlaceholder).toBeTruthy();
        expect(response._key).toBe('notExistingItem');
        expect(collection.data['notExistingItem']).toBe(response);
        expect(ComputedTracker.tracked).toHaveBeenCalledWith(response.observer);
      });
    });

    describe('getItemValue function tests', () => {
      let dummyItem: Item<ItemInterface>;

      beforeEach(() => {
        dummyItem = new Item(collection, { id: '1', name: 'Jeff' });
        collection.data = {
          ['1']: dummyItem,
        };

        jest.spyOn(collection, 'getItem');
      });

      it('should return existing Item Value (default config)', () => {
        const response = collection.getItemValue('1');

        expect(response).toBe(dummyItem._value);
        expect(collection.getItem).toHaveBeenCalledWith('1', {});
      });

      it("shouldn't return not existing Item Value (default config)", () => {
        const response = collection.getItemValue('notExistingItem');

        expect(response).toBeUndefined();
        expect(collection.getItem).toHaveBeenCalledWith('notExistingItem', {});
      });

      it("shouldn't return existing placeholder Item Value (default config)", () => {
        dummyItem.isPlaceholder = true;

        const response = collection.getItemValue('1');

        expect(response).toBeUndefined();
        expect(collection.getItem).toHaveBeenCalledWith('1', {});
      });

      it('should return existing placeholder Item Value (config.notExisting = true)', () => {
        dummyItem.isPlaceholder = true;

        const response = collection.getItemValue('1', {
          notExisting: true,
        });

        expect(response).toBe(dummyItem._value);
        expect(collection.getItem).toHaveBeenCalledWith('1', {
          notExisting: true,
        });
      });
    });

    describe('getAllItems function tests', () => {
      let dummyItem1: Item<ItemInterface>;
      let dummyItem2: Item<ItemInterface>;
      let dummyItem3: Item<ItemInterface>;

      beforeEach(() => {
        dummyItem1 = new Item(collection, { id: '1', name: 'Jeff' });
        dummyItem1.isPlaceholder = false;
        dummyItem2 = new Item(collection, { id: '2', name: 'Hans' });
        dummyItem2.isPlaceholder = true;
        dummyItem3 = new Item(collection, { id: '3', name: 'Frank' });
        dummyItem3.isPlaceholder = false;
        collection.data = {
          ['1']: dummyItem1,
          ['2']: dummyItem2,
          ['3']: dummyItem3,
        };

        collection.getDefaultGroup()?.add(['1', '2', '3']);
      });

      it('should return all existing Items (default config)', () => {
        const items = collection.getAllItems();

        expect(items.includes(dummyItem1)).toBeTruthy();
        expect(items.includes(dummyItem2)).toBeFalsy();
        expect(items.includes(dummyItem3)).toBeTruthy();
      });

      it('should return all Items (config.notExisting = true)', () => {
        const items = collection.getAllItems({ notExisting: true });

        expect(items.includes(dummyItem1)).toBeTruthy();
        expect(items.includes(dummyItem2)).toBeTruthy();
        expect(items.includes(dummyItem3)).toBeTruthy();
      });
    });

    describe('getAllItemValues function tests', () => {
      let dummyItem1: Item<ItemInterface>;
      let dummyItem2: Item<ItemInterface>;
      let dummyItem3: Item<ItemInterface>;

      beforeEach(() => {
        dummyItem1 = new Item(collection, { id: '1', name: 'Jeff' });
        dummyItem1.isPlaceholder = false;
        dummyItem2 = new Item(collection, { id: '2', name: 'Hans' });
        dummyItem2.isPlaceholder = true;
        dummyItem3 = new Item(collection, { id: '3', name: 'Frank' });
        dummyItem3.isPlaceholder = false;
        collection.data = {
          ['1']: dummyItem1,
          ['2']: dummyItem2,
          ['3']: dummyItem3,
        };

        collection.getDefaultGroup()?.add(['1', '2', '3']);

        jest.spyOn(collection, 'getAllItems');
      });

      it('should return all existing Items (default config)', () => {
        const itemValues = collection.getAllItemValues();

        expect(collection.getAllItems).toHaveBeenCalledWith({});
        expect(itemValues).toStrictEqual([
          { id: '1', name: 'Jeff' },
          { id: '3', name: 'Frank' },
        ]);
      });

      it('should return all Items (config.notExisting = true)', () => {
        const itemValues = collection.getAllItemValues({ notExisting: true });

        expect(collection.getAllItems).toHaveBeenCalledWith({
          notExisting: true,
        });
        expect(itemValues).toStrictEqual([
          { id: '1', name: 'Jeff' },
          { id: '2', name: 'Hans' },
          { id: '3', name: 'Frank' },
        ]);
      });
    });

    describe('persist function tests', () => {
      it('should create persistent with CollectionKey (default config)', () => {
        collection.persist();

        expect(collection.persistent).toBeInstanceOf(CollectionPersistent);
        expect(CollectionPersistent).toHaveBeenCalledWith(collection, {
          instantiate: true,
          storageKeys: [],
          key: collection._key,
          defaultStorageKey: null,
        });
      });

      it('should create persistent with CollectionKey (specific config)', () => {
        collection.persist({
          storageKeys: ['test1', 'test2'],
          loadValue: false,
          defaultStorageKey: 'test1',
        });

        expect(collection.persistent).toBeInstanceOf(CollectionPersistent);
        expect(CollectionPersistent).toHaveBeenCalledWith(collection, {
          instantiate: false,
          storageKeys: ['test1', 'test2'],
          key: collection._key,
          defaultStorageKey: 'test1',
        });
      });

      it('should create persistent with passed Key (default config)', () => {
        collection.persist('passedKey');

        expect(collection.persistent).toBeInstanceOf(CollectionPersistent);
        expect(CollectionPersistent).toHaveBeenCalledWith(collection, {
          instantiate: true,
          storageKeys: [],
          key: 'passedKey',
          defaultStorageKey: null,
        });
      });

      it('should create persistent with passed Key (specific config)', () => {
        collection.persist('passedKey', {
          storageKeys: ['test1', 'test2'],
          loadValue: false,
          defaultStorageKey: 'test1',
        });

        expect(collection.persistent).toBeInstanceOf(CollectionPersistent);
        expect(CollectionPersistent).toHaveBeenCalledWith(collection, {
          instantiate: false,
          storageKeys: ['test1', 'test2'],
          key: 'passedKey',
          defaultStorageKey: 'test1',
        });
      });

      it('should overwrite existing persistent with a warning', () => {
        collection.persistent = new CollectionPersistent(collection);

        collection.persist('newPersistentKey');

        expect(collection.persistent).toBeInstanceOf(CollectionPersistent);
        // expect(collection.persistent._key).toBe("newPersistentKey"); // Can not test because of Mocking Persistent
        expect(CollectionPersistent).toHaveBeenCalledWith(collection, {
          instantiate: true,
          storageKeys: [],
          key: 'newPersistentKey',
          defaultStorageKey: null,
        });
      });
    });

    describe('onLoad function tests', () => {
      const dummyCallbackFunction = jest.fn();

      it("should set onLoad function if Collection is persisted and shouldn't call it initially (collection.isPersisted = false)", () => {
        collection.persistent = new CollectionPersistent(collection);
        collection.isPersisted = false;

        collection.onLoad(dummyCallbackFunction);

        expect(collection.persistent.onLoad).toBe(dummyCallbackFunction);
        expect(dummyCallbackFunction).not.toHaveBeenCalled();
      });

      it('should set onLoad function if Collection is persisted and should call it initially (collection.isPersisted = true)', () => {
        collection.persistent = new CollectionPersistent(collection);
        collection.isPersisted = true;

        collection.onLoad(dummyCallbackFunction);

        expect(collection.persistent.onLoad).toBe(dummyCallbackFunction);
        expect(dummyCallbackFunction).toHaveBeenCalledWith(true);
      });

      it("shouldn't set onLoad function if Collection isn't persisted", () => {
        collection.onLoad(dummyCallbackFunction);

        expect(collection?.persistent?.onLoad).toBeUndefined();
        expect(dummyCallbackFunction).not.toHaveBeenCalled();
      });

      it("shouldn't set invalid onLoad callback function", () => {
        collection.persistent = new CollectionPersistent(collection);
        collection.isPersisted = true;

        collection.onLoad(10 as any);

        LogMock.hasLoggedCode('00:03:01', ['OnLoad Callback', 'function']);
      });
    });

    describe('getGroupCount function tests', () => {
      beforeEach(() => {
        collection.groups = {
          1: 'x' as any,
          2: 'y' as any,
          10: 'z' as any,
        };
      });

      it('should return count of registered Groups', () => {
        expect(collection.getGroupCount()).toBe(3);
      });
    });

    describe('getSelectorCount function tests', () => {
      beforeEach(() => {
        collection.selectors = {
          1: 'x' as any,
          2: 'y' as any,
          10: 'z' as any,
        };
      });

      it('should return count of registered Selectors', () => {
        expect(collection.getSelectorCount()).toBe(3);
      });
    });

    describe('reset function tests', () => {
      let dummyGroup: Group<ItemInterface>;
      let dummySelector: Selector<ItemInterface>;
      let dummyItem: Item<ItemInterface>;

      beforeEach(() => {
        dummyItem = new Item(collection, { id: 'dummyItem', name: 'frank' });
        collection.data = {
          dummyItem: dummyItem,
        };
        dummyGroup = new Group(collection, [], { key: 'dummyGroup' });
        collection.groups = {
          dummyGroup: dummyGroup,
        };
        dummySelector = new Selector(collection, 'dummyItem', {
          key: 'dummySelector',
        });
        collection.selectors = {
          dummySelector: dummySelector,
        };

        dummyGroup.reset = jest.fn();
        dummySelector.reset = jest.fn();
      });

      it('should reset Collection and its Selectors and Groups', () => {
        collection.reset();

        expect(collection.data).toStrictEqual({});
        expect(collection.size).toBe(0);
        expect(dummySelector.reset).toHaveBeenCalled();
        expect(dummyGroup.reset).toHaveBeenCalled();
      });
    });

    describe('put function tests', () => {
      let dummyGroup1: Group<ItemInterface>;
      let dummyGroup2: Group<ItemInterface>;

      beforeEach(() => {
        dummyGroup1 = new Group(collection, [], { key: 'dummyGroup1' });
        dummyGroup2 = new Group(collection, [], { key: 'dummyGroup2' });
        collection.groups = {
          dummyGroup1: dummyGroup1,
          dummyGroup2: dummyGroup2,
        };

        dummyGroup1.add = jest.fn();
        dummyGroup2.add = jest.fn();
      });

      it('should add passed itemKey to passed Group (default config)', () => {
        collection.put('1', 'dummyGroup1');

        expect(dummyGroup1.add).toHaveBeenCalledWith(['1'], {});
        expect(dummyGroup2.add).not.toHaveBeenCalled();
      });

      it('should add passed itemKey to passed Group (specific config)', () => {
        collection.put('1', 'dummyGroup1', {
          overwrite: true,
          method: 'push',
        });

        expect(dummyGroup1.add).toHaveBeenCalledWith(['1'], {
          overwrite: true,
          method: 'push',
        });
        expect(dummyGroup2.add).not.toHaveBeenCalled();
      });

      it('should add passed itemKeys to passed Groups (default config)', () => {
        collection.put(
          ['1', '2', '3'],
          ['dummyGroup1', 'notExistingGroup', 'dummyGroup2']
        );

        expect(dummyGroup1.add).toHaveBeenCalledWith(['1', '2', '3'], {});
        expect(dummyGroup2.add).toHaveBeenCalledWith(['1', '2', '3'], {});
      });
    });

    describe('move function tests', () => {
      let dummyGroup1: Group<ItemInterface>;
      let dummyGroup2: Group<ItemInterface>;

      beforeEach(() => {
        dummyGroup1 = new Group(collection, [], { key: 'dummyGroup1' });
        dummyGroup2 = new Group(collection, ['1', '2', '3'], {
          key: 'dummyGroup2',
        });
        collection.groups = {
          dummyGroup1: dummyGroup1,
          dummyGroup2: dummyGroup2,
        };

        dummyGroup1.add = jest.fn();
        dummyGroup1.remove = jest.fn();
        dummyGroup2.add = jest.fn();
        dummyGroup2.remove = jest.fn();
      });

      it('should remove passed itemKey/s from old Group and add it to the new one (default config)', () => {
        collection.move('1', 'dummyGroup2', 'dummyGroup1');

        expect(dummyGroup1.add).toHaveBeenCalledWith(['1'], {});
        expect(dummyGroup1.remove).not.toHaveBeenCalled();
        expect(dummyGroup2.add).not.toHaveBeenCalled();
        expect(dummyGroup2.remove).toHaveBeenCalledWith(['1'], {});
      });

      it('should remove passed itemKey/s from old Group and add it to the new one (specific config)', () => {
        collection.move('1', 'dummyGroup2', 'dummyGroup1', {
          background: true,
          overwrite: true,
          method: 'push',
        });

        expect(dummyGroup1.add).toHaveBeenCalledWith(['1'], {
          background: true,
          overwrite: true,
          method: 'push',
        });
        expect(dummyGroup1.remove).not.toHaveBeenCalled();
        expect(dummyGroup2.add).not.toHaveBeenCalled();
        expect(dummyGroup2.remove).toHaveBeenCalledWith(['1'], {
          background: true,
        });
      });
    });

    describe('updateItemKey function tests', () => {
      let dummySelector1: Selector<ItemInterface>;
      let dummySelector2: Selector<ItemInterface>;
      let dummySelector3: Selector<ItemInterface>;
      let dummyGroup1: Group<ItemInterface>;
      let dummyGroup2: Group<ItemInterface>;
      let dummyItem1: Item<ItemInterface>;
      let dummyItem2: Item<ItemInterface>;

      beforeEach(() => {
        dummyItem1 = new Item(collection, { id: 'dummyItem1', name: 'Jeff' });
        dummyItem1.persistent = new StatePersistent(dummyItem1);
        dummyItem2 = new Item(collection, { id: 'dummyItem2', name: 'Hans' });
        dummyItem2.persistent = new StatePersistent(dummyItem2);
        collection.data = {
          dummyItem1: dummyItem1,
          dummyItem2: dummyItem2,
        };

        dummyGroup1 = new Group(collection, ['dummyItem1', 'dummyItem2'], {
          key: 'dummyGroup1',
        });
        dummyGroup2 = new Group(collection, ['dummyItem2'], {
          key: 'dummyGroup2',
        });
        collection.groups = {
          dummyGroup1: dummyGroup1,
          dummyGroup2: dummyGroup2,
        };

        dummySelector1 = new Selector(collection, 'dummyItem1', {
          key: 'dummySelector1',
        });
        dummySelector2 = new Selector(collection, 'dummyItem2', {
          key: 'dummySelector2',
        });
        dummySelector3 = new Selector(collection, 'newDummyItem', {
          key: 'dummySelector3',
        });
        collection.selectors = {
          dummySelector1: dummySelector1,
          dummySelector2: dummySelector2,
          dummySelector3: dummySelector3,
        };

        dummyItem1.setKey = jest.fn();
        dummyItem2.setKey = jest.fn();
        dummyItem1.persistent.setKey = jest.fn();
        dummyItem2.persistent.setKey = jest.fn();

        dummyGroup1.replace = jest.fn();
        dummyGroup2.replace = jest.fn();

        dummySelector1.select = jest.fn();
        dummySelector2.select = jest.fn();
        dummySelector3.select = jest.fn();
      });

      it('should update ItemKey in Collection, Selectors and Groups (default config)', () => {
        const response = collection.updateItemKey('dummyItem1', 'newDummyItem');

        expect(response).toBeTruthy();

        expect(dummyItem1.setKey).toHaveBeenCalledWith('newDummyItem', {
          background: false,
        });
        expect(dummyItem2.setKey).not.toHaveBeenCalled();
        expect(dummyItem1.persistent?.setKey).toHaveBeenCalledWith(
          CollectionPersistent.getItemStorageKey(
            'newDummyItem',
            collection._key
          )
        );
        expect(dummyItem2.persistent?.setKey).not.toHaveBeenCalled();

        expect(dummyGroup1.replace).toHaveBeenCalledWith(
          'dummyItem1',
          'newDummyItem',
          {
            background: false,
          }
        );
        expect(dummyGroup2.replace).not.toHaveBeenCalled();

        expect(dummySelector1.select).toHaveBeenCalledWith('newDummyItem', {
          background: false,
        });
        expect(dummySelector2.select).not.toHaveBeenCalled();
        expect(dummySelector3.select).toHaveBeenCalledWith('newDummyItem', {
          force: true,
          background: false,
        });

        LogMock.hasNotLogged('warn');
      });

      it('should update ItemKey in Collection, Selectors and Groups (specific config)', () => {
        const response = collection.updateItemKey(
          'dummyItem1',
          'newDummyItem',
          {
            background: true,
          }
        );

        expect(response).toBeTruthy();

        expect(dummyItem1.setKey).toHaveBeenCalledWith('newDummyItem', {
          background: true,
        });
        expect(dummyItem1.persistent?.setKey).toHaveBeenCalledWith(
          CollectionPersistent.getItemStorageKey(
            'newDummyItem',
            collection._key
          )
        );

        expect(dummyGroup1.replace).toHaveBeenCalledWith(
          'dummyItem1',
          'newDummyItem',
          {
            background: true,
          }
        );

        expect(dummySelector1.select).toHaveBeenCalledWith('newDummyItem', {
          background: true,
        });
        expect(dummySelector3.select).toHaveBeenCalledWith('newDummyItem', {
          force: true,
          background: true,
        });

        LogMock.hasNotLogged('warn');
      });

      it('should update ItemKey in Collection, dummy Selectors and dummy Groups (default config)', () => {
        dummyGroup1.isPlaceholder = true;
        dummySelector1.isPlaceholder = true;

        const response = collection.updateItemKey('dummyItem1', 'newDummyItem');

        expect(response).toBeTruthy();

        expect(dummyItem1.setKey).toHaveBeenCalledWith('newDummyItem', {
          background: false,
        });
        expect(dummyItem1.persistent?.setKey).toHaveBeenCalledWith(
          CollectionPersistent.getItemStorageKey(
            'newDummyItem',
            collection._key
          )
        );

        expect(dummyGroup1.replace).toHaveBeenCalledWith(
          'dummyItem1',
          'newDummyItem',
          {
            background: false,
          }
        );

        expect(dummySelector1.select).toHaveBeenCalledWith('newDummyItem', {
          background: false,
        });
        expect(dummySelector3.select).toHaveBeenCalledWith('newDummyItem', {
          force: true,
          background: false,
        });

        LogMock.hasNotLogged('warn');
      });

      it("shouldn't update ItemKey of Item that doesn't exist (default config)", () => {
        const response = collection.updateItemKey(
          'notExistingItem',
          'newDummyItem'
        );

        expect(response).toBeFalsy();
        LogMock.hasNotLogged('warn');
      });

      it("shouldn't update ItemKey if it stayed the same (default config)", () => {
        const response = collection.updateItemKey('dummyItem1', 'dummyItem1');

        expect(response).toBeFalsy();
        LogMock.hasNotLogged('warn');
      });

      it("shouldn't update ItemKey if ItemKey called after the newItemKey already exists and should print warning (default config)", () => {
        const response = collection.updateItemKey('dummyItem1', 'dummyItem2');

        expect(response).toBeFalsy();
        LogMock.hasLoggedCode('1B:03:04', [
          'dummyItem1',
          'dummyItem2',
          collection._key,
        ]);
      });
    });

    describe('getGroupKeysThatHaveItemKey function tests', () => {
      let dummyGroup1: Group<ItemInterface>;
      let dummyGroup2: Group<ItemInterface>;
      let dummyGroup3: Group<ItemInterface>;

      beforeEach(() => {
        dummyGroup1 = new Group(
          collection,
          ['dummyItem1', 'dummyItem2', 'dummyItem3'],
          {
            key: 'dummyGroup1',
          }
        );
        dummyGroup2 = new Group(collection, ['dummyItem2', 'dummyItem3'], {
          key: 'dummyGroup2',
        });
        dummyGroup3 = new Group(collection, ['dummyItem3'], {
          key: 'dummyGroup3',
        });
        collection.groups = {
          dummyGroup1: dummyGroup1,
          dummyGroup2: dummyGroup2,
          dummyGroup3: dummyGroup3,
        };
      });

      it('should return groupKeys that contain ItemKey', () => {
        expect(
          collection.getGroupKeysThatHaveItemKey('unknownItem')
        ).toStrictEqual([]);
        expect(
          collection.getGroupKeysThatHaveItemKey('dummyItem1')
        ).toStrictEqual(['dummyGroup1']);
        expect(
          collection.getGroupKeysThatHaveItemKey('dummyItem2')
        ).toStrictEqual(['dummyGroup1', 'dummyGroup2']);
        expect(
          collection.getGroupKeysThatHaveItemKey('dummyItem3')
        ).toStrictEqual(['dummyGroup1', 'dummyGroup2', 'dummyGroup3']);
      });
    });

    describe('remove function tests', () => {
      beforeEach(() => {
        collection.removeFromGroups = jest.fn();
        collection.removeItems = jest.fn();
      });

      it('should remove Items from Group', () => {
        collection
          .remove(['test1', 'test2'])
          .fromGroups(['testGroup1', 'testGroup2']);

        expect(collection.removeFromGroups).toHaveBeenCalledWith(
          ['test1', 'test2'],
          ['testGroup1', 'testGroup2']
        );
        expect(collection.removeItems).not.toHaveBeenCalled();
      });

      it('should remove Items from everywhere', () => {
        collection.remove(['test1', 'test2']).everywhere();

        expect(collection.removeFromGroups).not.toHaveBeenCalled();
        expect(collection.removeItems).toHaveBeenCalledWith(['test1', 'test2']);
      });
    });

    describe('removeFromGroups function tests', () => {
      let dummyGroup1: Group<ItemInterface>;
      let dummyGroup2: Group<ItemInterface>;
      let dummyGroup3: Group<ItemInterface>;

      beforeEach(() => {
        dummyGroup1 = new Group(
          collection,
          ['dummyItem1', 'dummyItem2', 'dummyItem3', 'unknownItem'],
          {
            key: 'dummyGroup1',
          }
        );
        dummyGroup2 = new Group(
          collection,
          ['dummyItem2', 'dummyItem3', 'unknownItem'],
          {
            key: 'dummyGroup2',
          }
        );
        dummyGroup3 = new Group(collection, ['dummyItem3', 'unknownItem'], {
          key: 'dummyGroup3',
        });
        collection.groups = {
          dummyGroup1: dummyGroup1,
          dummyGroup2: dummyGroup2,
          dummyGroup3: dummyGroup3,
        };

        collection.removeItems = jest.fn();
        dummyGroup1.remove = jest.fn();
        dummyGroup2.remove = jest.fn();
        dummyGroup3.remove = jest.fn();
      });

      it('should remove ItemKey from Group', () => {
        collection.removeFromGroups('dummyItem2', 'dummyGroup1');

        expect(collection.removeItems).not.toHaveBeenCalled();
        expect(dummyGroup1.remove).toHaveBeenCalledWith('dummyItem2');
        expect(dummyGroup2.remove).not.toHaveBeenCalled();
        expect(dummyGroup3.remove).not.toHaveBeenCalled();
      });

      it('should remove ItemKeys from Groups', () => {
        collection.removeFromGroups(
          ['dummyItem2', 'dummyItem3'],
          ['dummyGroup2', 'dummyGroup3']
        );

        expect(collection.removeItems).not.toHaveBeenCalled();
        expect(dummyGroup1.remove).not.toHaveBeenCalled();
        expect(dummyGroup2.remove).toHaveBeenCalledWith('dummyItem2');
        expect(dummyGroup2.remove).toHaveBeenCalledWith('dummyItem3');
        expect(dummyGroup3.remove).not.toHaveBeenCalledWith('dummyItem2');
        expect(dummyGroup3.remove).toHaveBeenCalledWith('dummyItem3');
      });

      it('should remove Item from Collection if it got removed from all Groups in which it was in', () => {
        collection.removeFromGroups('dummyItem2', [
          'dummyGroup2',
          'dummyGroup1',
        ]);

        expect(collection.removeItems).toHaveBeenCalledWith('dummyItem2');
        expect(dummyGroup1.remove).toHaveBeenCalledWith('dummyItem2');
        expect(dummyGroup2.remove).toHaveBeenCalledWith('dummyItem2');
      });
    });

    describe('removeItems function test', () => {
      let dummySelector1: Selector<ItemInterface>;
      let dummySelector2: Selector<ItemInterface>;
      let dummyGroup1: Group<ItemInterface>;
      let dummyGroup2: Group<ItemInterface>;
      let dummyItem1: Item<ItemInterface>;
      let dummyItem2: Item<ItemInterface>;

      beforeEach(() => {
        dummyItem1 = new Item(collection, { id: 'dummyItem1', name: 'Jeff' });
        dummyItem1.persistent = new StatePersistent(dummyItem1);
        dummyItem2 = new Item(collection, { id: 'dummyItem2', name: 'Hans' });
        dummyItem2.persistent = new StatePersistent(dummyItem2);
        collection.data = {
          dummyItem1: dummyItem1,
          dummyItem2: dummyItem2,
        };
        collection.size = 2;

        dummyGroup1 = new Group(collection, ['dummyItem1', 'dummyItem2'], {
          key: 'dummyGroup1',
        });
        dummyGroup2 = new Group(collection, ['dummyItem2'], {
          key: 'dummyGroup2',
        });
        collection.groups = {
          dummyGroup1: dummyGroup1,
          dummyGroup2: dummyGroup2,
        };

        dummySelector1 = new Selector(collection, 'dummyItem1', {
          key: 'dummySelector1',
        });
        dummySelector2 = new Selector(collection, 'dummyItem2', {
          key: 'dummySelector2',
        });
        collection.selectors = {
          dummySelector1: dummySelector1,
          dummySelector2: dummySelector2,
        };

        dummyItem1.persistent.removePersistedValue = jest.fn();
        dummyItem2.persistent.removePersistedValue = jest.fn();

        dummyGroup1.remove = jest.fn();
        dummyGroup2.remove = jest.fn();

        dummySelector1.select = jest.fn();
        dummySelector2.select = jest.fn();
      });

      it('should remove Item from Collection, Groups and Selectors', () => {
        collection.removeItems('dummyItem1');

        expect(collection.data).not.toHaveProperty('dummyItem1');
        expect(collection.data).toHaveProperty('dummyItem2');
        expect(collection.size).toBe(1);

        expect(dummyItem1.persistent?.removePersistedValue).toHaveBeenCalled();
        expect(
          dummyItem2.persistent?.removePersistedValue
        ).not.toHaveBeenCalled();

        expect(dummyGroup1.remove).toHaveBeenCalledWith('dummyItem1');
        expect(dummyGroup2.remove).not.toHaveBeenCalled();

        expect(dummySelector1.select).toHaveBeenCalledWith('dummyItem1', {
          force: true,
        });
        expect(dummySelector2.select).not.toHaveBeenCalled();
      });

      it('should remove Items from Collection, Groups and Selectors', () => {
        collection.removeItems(['dummyItem1', 'dummyItem2', 'notExistingItem']);

        expect(collection.data).not.toHaveProperty('dummyItem1');
        expect(collection.data).not.toHaveProperty('dummyItem2');
        expect(collection.size).toBe(0);

        expect(dummyItem1.persistent?.removePersistedValue).toHaveBeenCalled();
        expect(dummyItem2.persistent?.removePersistedValue).toHaveBeenCalled();

        expect(dummyGroup1.remove).toHaveBeenCalledWith('dummyItem1');
        expect(dummyGroup1.remove).toHaveBeenCalledWith('dummyItem2');
        expect(dummyGroup2.remove).not.toHaveBeenCalledWith('dummyItem1');
        expect(dummyGroup2.remove).toHaveBeenCalledWith('dummyItem2');

        expect(dummySelector1.select).toHaveBeenCalledWith('dummyItem1', {
          force: true,
        });
        expect(dummySelector2.select).toHaveBeenCalledWith('dummyItem2', {
          force: true,
        });
      });
    });

    describe('setData function tests', () => {
      let dummyItem1: Item<ItemInterface>;

      beforeEach(() => {
        dummyItem1 = new Item(collection, { id: 'dummyItem1', name: 'Jeff' });
        collection.data = {
          dummyItem1: dummyItem1,
        };
        collection.size = 1;

        dummyItem1.patch = jest.fn();
        dummyItem1.set = jest.fn();
      });

      it('should create new Item out of valid Data, rebuild Groups and increase size (default config)', () => {
        const response = collection.setData({ id: 'dummyItem2', name: 'Hans' });

        expect(response).toBeTruthy();
        expect(collection.data).toHaveProperty('dummyItem1');
        expect(collection.data).toHaveProperty('dummyItem2');
        expect(collection.data['dummyItem2']).toBeInstanceOf(Item);
        expect(collection.data['dummyItem2']._value).toStrictEqual({
          id: 'dummyItem2',
          name: 'Hans',
        });
        expect(collection.size).toBe(2);

        LogMock.hasNotLogged('error');
        LogMock.hasNotLogged('warn');
      });

      it("shouldn't create new Item if passed Data is no valid Object", () => {
        const response = collection.setData('noObject' as any);

        expect(response).toBeFalsy();
        expect(collection.size).toBe(1);

        LogMock.hasLoggedCode('1B:03:05', [collection._key]);
        LogMock.hasNotLogged('warn');
      });

      it('should create new Item with random primaryKey if passed Data has no primaryKey', () => {
        jest.spyOn(Utils, 'generateId').mockReturnValueOnce('randomDummyId');

        const response = collection.setData({ name: 'Frank' } as any);

        expect(response).toBeTruthy();
        expect(response).toBeTruthy();
        expect(collection.data).toHaveProperty('dummyItem1');
        expect(collection.data).toHaveProperty('randomDummyId');
        expect(collection.data['randomDummyId']).toBeInstanceOf(Item);
        expect(collection.data['randomDummyId']._value).toStrictEqual({
          id: 'randomDummyId',
          name: 'Frank',
        });
        expect(collection.size).toBe(2);

        LogMock.hasNotLogged('error');
        LogMock.hasLoggedCode('1B:02:05', [
          collection._key,
          collection.config.primaryKey,
        ]);
      });

      it("should update Item with valid Data, shouldn't rebuild Groups and shouldn't increase size (default config)", () => {
        const response = collection.setData({
          id: 'dummyItem1',
          name: 'Dieter',
        });

        expect(response).toBeTruthy();

        expect(collection.data).toHaveProperty('dummyItem1');
        expect(collection.data['dummyItem1']).toBeInstanceOf(Item);
        expect(collection.size).toBe(1);

        expect(dummyItem1.set).toHaveBeenCalledWith(
          { id: 'dummyItem1', name: 'Dieter' },
          { background: false }
        );
        expect(dummyItem1.patch).not.toHaveBeenCalled();

        LogMock.hasNotLogged('error');
        LogMock.hasNotLogged('warn');
      });

      it("should update Item with valid Data, shouldn't rebuild Groups and shouldn't increase size (config.background = true)", () => {
        const response = collection.setData(
          {
            id: 'dummyItem1',
            name: 'Dieter',
          },
          { background: true }
        );

        expect(response).toBeTruthy();

        expect(collection.data).toHaveProperty('dummyItem1');
        expect(collection.data['dummyItem1']).toBeInstanceOf(Item);
        expect(collection.size).toBe(1);

        expect(dummyItem1.set).toHaveBeenCalledWith(
          { id: 'dummyItem1', name: 'Dieter' },
          { background: true }
        );
        expect(dummyItem1.patch).not.toHaveBeenCalled();

        LogMock.hasNotLogged('error');
        LogMock.hasNotLogged('warn');
      });

      it("should update Item with valid Data, shouldn't rebuild Groups and shouldn't increase size (config.patch = true, background: true)", () => {
        const response = collection.setData(
          {
            id: 'dummyItem1',
            name: 'Dieter',
          },
          { patch: true, background: true }
        );

        expect(response).toBeTruthy();

        expect(collection.data).toHaveProperty('dummyItem1');
        expect(collection.data['dummyItem1']).toBeInstanceOf(Item);
        expect(collection.size).toBe(1);

        expect(dummyItem1.set).not.toHaveBeenCalled();
        expect(dummyItem1.patch).toHaveBeenCalledWith(
          { id: 'dummyItem1', name: 'Dieter' },
          { background: true }
        );

        LogMock.hasNotLogged('error');
        LogMock.hasNotLogged('warn');
      });

      it("should update placeholder Item with valid Data, shouldn't rebuild Groups and should increase size (default config)", () => {
        dummyItem1.isPlaceholder = true;
        collection.size = 0;

        const response = collection.setData({
          id: 'dummyItem1',
          name: 'Dieter',
        });

        expect(response).toBeTruthy();

        expect(collection.data).toHaveProperty('dummyItem1');
        expect(collection.data['dummyItem1']).toBeInstanceOf(Item);
        expect(collection.size).toBe(1);

        expect(dummyItem1.set).toHaveBeenCalledWith(
          { id: 'dummyItem1', name: 'Dieter' },
          { background: false }
        );

        LogMock.hasNotLogged('error');
        LogMock.hasNotLogged('warn');
      });
    });

    describe('rebuildGroupsThatIncludeItemKey function tests', () => {
      let dummyGroup1: Group<ItemInterface>;
      let dummyGroup2: Group<ItemInterface>;

      beforeEach(() => {
        dummyGroup1 = new Group(collection, ['dummyItem1', 'dummyItem2'], {
          key: 'dummyGroup1',
        });
        dummyGroup2 = new Group(collection, ['dummyItem2'], {
          key: 'dummyGroup2',
        });
        collection.groups = {
          dummyGroup1: dummyGroup1,
          dummyGroup2: dummyGroup2,
        };

        dummyGroup1.ingest = jest.fn();
        dummyGroup2.ingest = jest.fn();
      });

      it('should call ingest on each Group that includes the passed ItemKey (default config)', () => {
        collection.rebuildGroupsThatIncludeItemKey('dummyItem1');

        expect(dummyGroup1.ingest).toHaveBeenCalledWith({
          background: false,
          force: true,
          sideEffects: {
            enabled: true,
            exclude: [],
          },
          storage: false,
        });
        expect(dummyGroup2.ingest).not.toHaveBeenCalled();
      });

      it('should call ingest on each Group that includes the passed ItemKey (specific config)', () => {
        collection.rebuildGroupsThatIncludeItemKey('dummyItem2', {
          background: true,
          sideEffects: {
            enabled: false,
          },
        });

        expect(dummyGroup1.ingest).toHaveBeenCalledWith({
          background: true,
          force: true,
          sideEffects: {
            enabled: false,
          },
          storage: false,
        });
        expect(dummyGroup2.ingest).toHaveBeenCalledWith({
          background: true,
          force: true,
          sideEffects: {
            enabled: false,
          },
          storage: false,
        });
      });
    });
  });
});
