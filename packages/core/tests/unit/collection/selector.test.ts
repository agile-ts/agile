import { Selector, Agile, Collection, StateObserver, Item } from '../../../src';
import { LogMock } from '../../helper/logMock';

describe('Selector Tests', () => {
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

    jest.spyOn(Selector.prototype, 'select');

    jest.clearAllMocks();
  });

  it('should create Selector and call initial select (default config)', () => {
    // Overwrite select once to not call it
    jest
      .spyOn(Selector.prototype, 'select')
      .mockReturnValueOnce(undefined as any);

    const selector = new Selector(dummyCollection, 'dummyItemKey');

    expect(selector.collection()).toBe(dummyCollection);
    expect(selector._item).toBeNull(); // Because 'select()' is mocked
    expect(selector._itemKey).toBe('dummyItemKey');
    expect(selector.select).toHaveBeenCalledWith('dummyItemKey', {
      overwrite: true,
    });

    // Check if State was called with correct parameters
    expect(selector._key).toBeUndefined();
    expect(selector.valueType).toBeUndefined();
    expect(selector.isSet).toBeFalsy();
    expect(selector.isPlaceholder).toBeTruthy();
    expect(selector.initialStateValue).toBeNull();
    expect(selector._value).toBeNull();
    expect(selector.previousStateValue).toBeNull();
    expect(selector.nextStateValue).toBeNull();
    expect(selector.observers['value']).toBeInstanceOf(StateObserver);
    expect(Array.from(selector.observers['value'].dependents)).toStrictEqual(
      []
    );
    expect(selector.observers['value']._key).toBeUndefined();
    expect(selector.sideEffects).toStrictEqual({});
    expect(selector.computeValueMethod).toBeUndefined();
    expect(selector.computeExistsMethod).toBeInstanceOf(Function);
    expect(selector.isPersisted).toBeFalsy();
    expect(selector.persistent).toBeUndefined();
    expect(selector.watchers).toStrictEqual({});
  });

  it('should create Selector and call initial select (specific config)', () => {
    // Overwrite select once to not call it
    jest
      .spyOn(Selector.prototype, 'select')
      .mockReturnValueOnce(undefined as any);

    const selector = new Selector(dummyCollection, 'dummyItemKey', {
      key: 'dummyKey',
    });

    expect(selector.collection()).toBe(dummyCollection);
    expect(selector._item).toBeNull(); // Because 'select()' is mocked
    expect(selector._itemKey).toBe('dummyItemKey');
    expect(selector.select).toHaveBeenCalledWith('dummyItemKey', {
      overwrite: true,
    });

    // Check if State was called with correct parameters
    expect(selector._key).toBe('dummyKey');
    expect(selector.valueType).toBeUndefined();
    expect(selector.isSet).toBeFalsy();
    expect(selector.isPlaceholder).toBeTruthy();
    expect(selector.initialStateValue).toBeNull();
    expect(selector._value).toBeNull();
    expect(selector.previousStateValue).toBeNull();
    expect(selector.nextStateValue).toBeNull();
    expect(selector.observers['value']).toBeInstanceOf(StateObserver);
    expect(Array.from(selector.observers['value'].dependents)).toStrictEqual(
      []
    );
    expect(selector.observers['value']._key).toBe('dummyKey');
    expect(selector.sideEffects).toStrictEqual({});
    expect(selector.computeValueMethod).toBeUndefined();
    expect(selector.computeExistsMethod).toBeInstanceOf(Function);
    expect(selector.isPersisted).toBeFalsy();
    expect(selector.persistent).toBeUndefined();
    expect(selector.watchers).toStrictEqual({});
  });

  it("should create Selector and shouldn't call initial select (config.isPlaceholder = true)", () => {
    // Overwrite select once to not call it
    jest
      .spyOn(Selector.prototype, 'select')
      .mockReturnValueOnce(undefined as any);

    const selector = new Selector(dummyCollection, 'dummyItemKey', {
      isPlaceholder: true,
    });

    expect(selector.collection()).toBe(dummyCollection);
    expect(selector._item).toBeNull();
    expect(selector._itemKey).toBeNull();
    expect(selector.select).not.toHaveBeenCalled();

    // Check if State was called with correct parameters
    expect(selector._key).toBeUndefined();
    expect(selector.valueType).toBeUndefined();
    expect(selector.isSet).toBeFalsy();
    expect(selector.isPlaceholder).toBeTruthy();
    expect(selector.initialStateValue).toBeNull();
    expect(selector._value).toBeNull();
    expect(selector.previousStateValue).toBeNull();
    expect(selector.nextStateValue).toBeNull();
    expect(selector.observers['value']).toBeInstanceOf(StateObserver);
    expect(Array.from(selector.observers['value'].dependents)).toStrictEqual(
      []
    );
    expect(selector.observers['value']._key).toBeUndefined();
    expect(selector.sideEffects).toStrictEqual({});
    expect(selector.computeValueMethod).toBeUndefined();
    expect(selector.computeExistsMethod).toBeInstanceOf(Function);
    expect(selector.isPersisted).toBeFalsy();
    expect(selector.persistent).toBeUndefined();
    expect(selector.watchers).toStrictEqual({});
  });

  it("should create Selector and shouldn't call initial select if specified selector key is null (default config)", () => {
    // Overwrite select once to not call it
    jest
      .spyOn(Selector.prototype, 'select')
      .mockReturnValueOnce(undefined as any);

    const selector = new Selector(dummyCollection, null);

    expect(selector.collection()).toBe(dummyCollection);
    expect(selector._item).toBeNull();
    expect(selector._itemKey).toBeNull();
    expect(selector.select).not.toHaveBeenCalled();

    // Check if State was called with correct parameters
    expect(selector._key).toBeUndefined();
    expect(selector.valueType).toBeUndefined();
    expect(selector.isSet).toBeFalsy();
    expect(selector.isPlaceholder).toBeTruthy();
    expect(selector.initialStateValue).toBeNull();
    expect(selector._value).toBeNull();
    expect(selector.previousStateValue).toBeNull();
    expect(selector.nextStateValue).toBeNull();
    expect(selector.observers['value']).toBeInstanceOf(StateObserver);
    expect(Array.from(selector.observers['value'].dependents)).toStrictEqual(
      []
    );
    expect(selector.observers['value']._key).toBeUndefined();
    expect(selector.sideEffects).toStrictEqual({});
    expect(selector.computeValueMethod).toBeUndefined();
    expect(selector.computeExistsMethod).toBeInstanceOf(Function);
    expect(selector.isPersisted).toBeFalsy();
    expect(selector.persistent).toBeUndefined();
    expect(selector.watchers).toStrictEqual({});
  });

  describe('Selector Function Tests', () => {
    let selector: Selector<ItemInterface>;
    let dummyItem1: Item<ItemInterface>;

    beforeEach(() => {
      dummyItem1 = new Item(dummyCollection, {
        id: 'dummyItem1',
        name: 'Frank',
      });
      dummyCollection.data = {
        dummyItem1: dummyItem1,
      };

      selector = new Selector<ItemInterface>(dummyCollection, 'dummyItem1');
    });

    describe('itemKey set function tests', () => {
      it('should call the select() method with the passed value', () => {
        selector.select = jest.fn();
        selector._itemKey = null as any;

        selector.itemKey = 'newItemKey';

        expect(selector.select).toHaveBeenCalledWith('newItemKey');
        expect(selector._itemKey).toBeNull();
      });
    });

    describe('itemKey get function tests', () => {
      it('should return the identifier of the Item currently selected by the Selector', () => {
        selector._itemKey = 'coolItemKey';

        expect(selector.itemKey).toBe('coolItemKey');
      });
    });

    describe('item set function tests', () => {
      it('should call the select() method with the Item identifier of the specified Item', () => {
        selector.select = jest.fn();
        selector._item = null as any;

        dummyItem1._key = 'AReallyCoolKey';

        selector.item = dummyItem1;

        expect(selector.select).toHaveBeenCalledWith('AReallyCoolKey');
        expect(selector._item).toBeNull();
      });
    });

    describe('item get function tests', () => {
      it('should return the currently selected Item of the Selector', () => {
        selector._item = dummyItem1;

        expect(selector.item).toBe(dummyItem1);
      });
    });

    describe('select function tests', () => {
      let dummyItem2: Item<ItemInterface>;

      beforeEach(() => {
        dummyItem2 = new Item(dummyCollection, {
          id: 'dummyItem2',
          name: 'Jeff',
        });
        dummyCollection.data['dummyItem2'] = dummyItem2;

        selector.rebuildSelector = jest.fn();
        selector.unselect = jest.fn();
        dummyItem1.addSideEffect = jest.fn();
        dummyItem2.addSideEffect = jest.fn();
        selector.addSideEffect = jest.fn();
      });

      it('should unselect old selected Item and select new Item (default config)', () => {
        dummyCollection.getItemWithReference = jest.fn(() => dummyItem2);

        selector.select('dummyItem2');

        expect(dummyCollection.getItemWithReference).toHaveBeenCalledWith(
          'dummyItem2'
        );

        expect(selector._itemKey).toBe('dummyItem2');
        expect(selector._item).toBe(dummyItem2);
        expect(selector.unselect).toHaveBeenCalledWith({ background: true });
        expect(selector.rebuildSelector).toHaveBeenCalledWith({
          background: false,
          sideEffects: {
            enabled: true,
            exclude: [],
          },
          force: false,
          overwrite: false,
          storage: true,
        });
        expect(
          selector.addSideEffect
        ).toHaveBeenCalledWith(
          Selector.rebuildItemSideEffectKey,
          expect.any(Function),
          { weight: 90 }
        );

        expect(
          dummyItem2.addSideEffect
        ).toHaveBeenCalledWith(
          Selector.rebuildSelectorSideEffectKey,
          expect.any(Function),
          { weight: 100 }
        );
        expect(Array.from(dummyItem2.selectedBy)).toStrictEqual([
          selector._key,
        ]);
      });

      it('should unselect old selected Item and select new Item (specific config)', () => {
        dummyCollection.getItemWithReference = jest.fn(() => dummyItem2);

        selector.select('dummyItem2', {
          force: true,
          sideEffects: {
            enabled: false,
          },
          background: true,
          overwrite: true,
        });

        expect(dummyCollection.getItemWithReference).toHaveBeenCalledWith(
          'dummyItem2'
        );

        expect(selector._itemKey).toBe('dummyItem2');
        expect(selector._item).toBe(dummyItem2);
        expect(selector.unselect).toHaveBeenCalledWith({ background: true });
        expect(selector.rebuildSelector).toHaveBeenCalledWith({
          background: true,
          sideEffects: {
            enabled: false,
          },
          force: true,
          overwrite: true,
          storage: true,
        });
        expect(
          selector.addSideEffect
        ).toHaveBeenCalledWith(
          Selector.rebuildItemSideEffectKey,
          expect.any(Function),
          { weight: 90 }
        );

        expect(
          dummyItem2.addSideEffect
        ).toHaveBeenCalledWith(
          Selector.rebuildSelectorSideEffectKey,
          expect.any(Function),
          { weight: 100 }
        );
        expect(dummyItem2.selectedBy.size).toBe(1);
        expect(dummyItem2.selectedBy.has(selector._key as any));
      });

      it("shouldn't select selected Item again (default config)", () => {
        dummyCollection.getItemWithReference = jest.fn(() => dummyItem1);

        selector.select('dummyItem1');

        expect(dummyCollection.getItemWithReference).not.toHaveBeenCalled();
        expect(selector._itemKey).toBe('dummyItem1');
        expect(selector._item).toBe(dummyItem1);
        expect(selector.unselect).not.toHaveBeenCalled();
        expect(selector.rebuildSelector).not.toHaveBeenCalled();
        expect(selector.addSideEffect).not.toHaveBeenCalled();

        expect(dummyItem1.addSideEffect).not.toHaveBeenCalled();
        expect(Array.from(dummyItem1.selectedBy)).toStrictEqual([
          selector._key,
        ]);
      });

      it('should select selected Item again (config.force = true)', () => {
        dummyCollection.getItemWithReference = jest.fn(() => dummyItem1);

        selector.select('dummyItem1', { force: true });

        expect(console.warn).not.toHaveBeenCalled();

        expect(dummyCollection.getItemWithReference).toHaveBeenCalledWith(
          'dummyItem1'
        );

        expect(selector._itemKey).toBe('dummyItem1');
        expect(selector._item).toBe(dummyItem1);
        expect(selector.unselect).toHaveBeenCalledWith({ background: true });
        expect(selector.rebuildSelector).toHaveBeenCalledWith({
          background: false,
          sideEffects: {
            enabled: true,
            exclude: [],
          },
          force: true,
          overwrite: false,
          storage: true,
        });
        expect(
          selector.addSideEffect
        ).toHaveBeenCalledWith(
          Selector.rebuildItemSideEffectKey,
          expect.any(Function),
          { weight: 90 }
        );

        expect(
          dummyItem1.addSideEffect
        ).toHaveBeenCalledWith(
          Selector.rebuildSelectorSideEffectKey,
          expect.any(Function),
          { weight: 100 }
        );
        expect(dummyItem1.selectedBy.size).toBe(1);
        expect(dummyItem1.selectedBy.has(selector._key as any));
      });

      it("shouldn't select Item if Collection isn't instantiated (default config)", () => {
        dummyCollection.getItemWithReference = jest.fn(() => dummyItem2);
        dummyCollection.isInstantiated = false;

        selector.select('dummyItem2');

        expect(dummyCollection.getItemWithReference).not.toHaveBeenCalled();
        expect(selector._itemKey).toBe('dummyItem1');
        expect(selector._item).toBe(dummyItem1);
        expect(selector.unselect).not.toHaveBeenCalled();
        expect(selector.rebuildSelector).not.toHaveBeenCalled();
        expect(selector.addSideEffect).not.toHaveBeenCalled();

        expect(dummyItem2.addSideEffect).not.toHaveBeenCalled();
        expect(Array.from(dummyItem2.selectedBy)).toStrictEqual([]);
      });

      it("should unselect old selected Item and select new Item although Collection isn't instantiated (config.force = true)", () => {
        dummyCollection.getItemWithReference = jest.fn(() => dummyItem2);
        dummyCollection.isInstantiated = false;

        selector.select('dummyItem2', {
          force: true,
        });

        expect(dummyCollection.getItemWithReference).toHaveBeenCalledWith(
          'dummyItem2'
        );

        expect(selector._itemKey).toBe('dummyItem2');
        expect(selector._item).toBe(dummyItem2);
        expect(selector.unselect).toHaveBeenCalledWith({ background: true });
        expect(selector.rebuildSelector).toHaveBeenCalledWith({
          background: false,
          sideEffects: {
            enabled: true,
            exclude: [],
          },
          force: true,
          overwrite: false,
          storage: true,
        });
        expect(
          selector.addSideEffect
        ).toHaveBeenCalledWith(
          Selector.rebuildItemSideEffectKey,
          expect.any(Function),
          { weight: 90 }
        );

        expect(
          dummyItem2.addSideEffect
        ).toHaveBeenCalledWith(
          Selector.rebuildSelectorSideEffectKey,
          expect.any(Function),
          { weight: 100 }
        );
        expect(Array.from(dummyItem2.selectedBy)).toStrictEqual([
          selector._key,
        ]);
      });

      it('should remove old selected Item, select new Item and overwrite Selector if old Item is placeholder (default config)', async () => {
        dummyCollection.getItemWithReference = jest.fn(() => dummyItem2);
        dummyItem1.isPlaceholder = true;

        selector.select('dummyItem2');

        expect(dummyCollection.getItemWithReference).toHaveBeenCalledWith(
          'dummyItem2'
        );
        expect(selector._itemKey).toBe('dummyItem2');
        expect(selector._item).toBe(dummyItem2);
        expect(selector.unselect).toHaveBeenCalledWith({ background: true });
        expect(selector.rebuildSelector).toHaveBeenCalledWith({
          background: false,
          sideEffects: {
            enabled: true,
            exclude: [],
          },
          force: false,
          overwrite: true,
          storage: true,
        });
        expect(
          selector.addSideEffect
        ).toHaveBeenCalledWith(
          Selector.rebuildItemSideEffectKey,
          expect.any(Function),
          { weight: 90 }
        );

        expect(
          dummyItem2.addSideEffect
        ).toHaveBeenCalledWith(
          Selector.rebuildSelectorSideEffectKey,
          expect.any(Function),
          { weight: 100 }
        );
        expect(Array.from(dummyItem2.selectedBy)).toStrictEqual([
          selector._key,
        ]);
      });

      it("should remove old selected Item, select new Item and shouldn't overwrite Selector if old Item is placeholder (config.overwrite = false)", async () => {
        dummyCollection.getItemWithReference = jest.fn(() => dummyItem2);
        dummyItem1.isPlaceholder = true;

        selector.select('dummyItem2', { overwrite: false });

        expect(dummyCollection.getItemWithReference).toHaveBeenCalledWith(
          'dummyItem2'
        );
        expect(selector._itemKey).toBe('dummyItem2');
        expect(selector._item).toBe(dummyItem2);
        expect(selector.unselect).toHaveBeenCalledWith({ background: true });
        expect(selector.rebuildSelector).toHaveBeenCalledWith({
          background: false,
          sideEffects: {
            enabled: true,
            exclude: [],
          },
          force: false,
          overwrite: false,
          storage: true,
        });
        expect(
          selector.addSideEffect
        ).toHaveBeenCalledWith(
          Selector.rebuildItemSideEffectKey,
          expect.any(Function),
          { weight: 90 }
        );

        expect(
          dummyItem2.addSideEffect
        ).toHaveBeenCalledWith(
          Selector.rebuildSelectorSideEffectKey,
          expect.any(Function),
          { weight: 100 }
        );
        expect(Array.from(dummyItem2.selectedBy)).toStrictEqual([
          selector._key,
        ]);
      });

      it("shouldn't select null and unselect old Item (default config)", () => {
        dummyCollection.getItemWithReference = jest.fn(() => dummyItem2);

        selector.select(null);

        expect(dummyCollection.getItemWithReference).not.toHaveBeenCalled();
        // expect(selector._itemKey).toBe(Selector.unknownItemPlaceholderKey); // Because 'unselect()' is mocked
        // expect(selector._item).toBeNull(); // Because 'unselect()' is mocked
        expect(selector.unselect).toHaveBeenCalledWith({ background: false });
        expect(selector.rebuildSelector).not.toHaveBeenCalled();
        expect(selector.addSideEffect).not.toHaveBeenCalled();
      });

      describe('test added sideEffect called Selector.rebuildSelectorSideEffectKey', () => {
        beforeEach(() => {
          selector.rebuildSelector = jest.fn();
        });

        it('should call rebuildSelector', () => {
          selector.select('dummyItem1');

          dummyItem1.sideEffects[
            Selector.rebuildSelectorSideEffectKey
          ].callback(dummyItem1, {
            dummy: 'property',
          });

          expect(selector.rebuildSelector).toHaveBeenCalledWith({
            dummy: 'property',
          });
        });
      });

      describe('test added sideEffect called Selector.rebuildItemSideEffectKey', () => {
        beforeEach(() => {
          dummyItem1.set = jest.fn();
        });

        it('should call set on Item if Item is no placeholder', () => {
          dummyItem1.isPlaceholder = false;
          selector._value = { id: '1', name: 'jeff' };

          selector.select('dummyItem1');

          selector.sideEffects[Selector.rebuildItemSideEffectKey].callback(
            selector,
            {
              dummy: 'property',
            }
          );

          expect(dummyItem1.set).toHaveBeenCalledWith(
            { id: '1', name: 'jeff' },
            {
              dummy: 'property',
              sideEffects: {
                enabled: true,
                exclude: [Selector.rebuildSelectorSideEffectKey],
              },
            }
          );
        });

        it("shouldn't call set on Item if Item is on placeholder", () => {
          dummyItem1.isPlaceholder = true;

          selector.select('dummyItem1');

          selector.sideEffects[Selector.rebuildItemSideEffectKey].callback(
            selector,
            {
              dummy: 'property',
            }
          );

          expect(dummyItem1.set).not.toHaveBeenCalled();
        });
      });
    });

    describe('reselect function tests', () => {
      beforeEach(() => {
        selector.select = jest.fn();
      });

      it("should reselect Item if Item isn't selected correctly (default config)", () => {
        jest.spyOn(selector, 'hasSelected').mockReturnValueOnce(false);

        selector.reselect();

        expect(selector.select).toHaveBeenCalledWith(selector._itemKey, {});
      });

      it("should reselect Item if Item isn't selected correctly (specific config)", () => {
        jest.spyOn(selector, 'hasSelected').mockReturnValueOnce(false);

        selector.reselect({ force: true, background: true });

        expect(selector.select).toHaveBeenCalledWith(selector._itemKey, {
          force: true,
          background: true,
        });
      });

      it("shouldn't reselect Item if itemKey is not set", () => {
        jest.spyOn(selector, 'hasSelected').mockReturnValueOnce(false);
        selector._itemKey = null as any;

        selector.reselect();

        expect(selector.select).not.toHaveBeenCalled();
      });

      it("shouldn't reselect Item if Item is already selected correctly", () => {
        jest.spyOn(selector, 'hasSelected').mockReturnValueOnce(true);

        selector.reselect();

        expect(selector.select).not.toHaveBeenCalled();
      });
    });

    describe('unselect function tests', () => {
      beforeEach(() => {
        selector.rebuildSelector = jest.fn();
        dummyItem1.removeSideEffect = jest.fn();
      });

      it("should unselect current selected Item and shouldn't remove it from Collection (default config)", () => {
        selector.unselect();

        expect(dummyItem1.selectedBy.size).toBe(0);
        expect(dummyItem1.removeSideEffect).toHaveBeenCalledWith(
          Selector.rebuildSelectorSideEffectKey
        );

        expect(selector._item).toBeNull();
        expect(selector._itemKey).toBeNull();
        expect(selector.isPlaceholder).toBeTruthy();
        expect(selector.rebuildSelector).toHaveBeenCalledWith({});

        expect(dummyCollection.data).toHaveProperty('dummyItem1');
      });

      it("should unselect current selected Item and shouldn't remove it from Collection (specific config)", () => {
        selector.unselect({
          background: true,
          overwrite: true,
          force: true,
        });

        expect(dummyItem1.selectedBy.size).toBe(0);
        expect(dummyItem1.removeSideEffect).toHaveBeenCalledWith(
          Selector.rebuildSelectorSideEffectKey
        );

        expect(selector._item).toBeNull();
        expect(selector._itemKey).toBeNull();
        expect(selector.isPlaceholder).toBeTruthy();
        expect(selector.rebuildSelector).toHaveBeenCalledWith({
          background: true,
          overwrite: true,
          force: true,
        });

        expect(dummyCollection.data).toHaveProperty('dummyItem1');
      });

      it('should unselect current selected placeholder Item and remove it from Collection (default config)', () => {
        dummyItem1.isPlaceholder = true;

        selector.unselect();

        expect(dummyItem1.selectedBy.size).toBe(0);
        expect(dummyItem1.removeSideEffect).toHaveBeenCalledWith(
          Selector.rebuildSelectorSideEffectKey
        );

        expect(selector._item).toBeNull();
        expect(selector._itemKey).toBeNull();
        expect(selector.isPlaceholder).toBeTruthy();
        expect(selector.rebuildSelector).toHaveBeenCalledWith({});

        expect(dummyCollection.data).not.toHaveProperty('dummyItem1');
      });
    });

    describe('hasSelected function tests', () => {
      beforeEach(() => {
        selector._itemKey = 'dummyItemKey';
      });

      it('should return true if Selector has selected itemKey correctly and Item isSelected', () => {
        if (selector._item) selector._item.selectedBy.add(selector._key as any);

        expect(selector.hasSelected('dummyItemKey')).toBeTruthy();
      });

      it("should return false if Selector hasn't selected itemKey correctly (itemKey = undefined)", () => {
        expect(selector.hasSelected('notSelectedItemKey')).toBeFalsy();
      });

      it("should return false if Selector hasn't selected itemKey correctly (itemKey = undefined, correctlySelected = false)", () => {
        expect(selector.hasSelected('notSelectedItemKey', false)).toBeFalsy();
      });

      it("should return false if Selector hasn't selected itemKey correctly (item = undefined)", () => {
        selector._item = null;

        expect(selector.hasSelected('dummyItemKey')).toBeFalsy();
      });

      it("should return true if Selector hasn't selected itemKey correctly (item = undefined, correctlySelected = false)", () => {
        selector._item = null;

        expect(selector.hasSelected('dummyItemKey', false)).toBeTruthy();
      });

      it("should return false if Selector has selected itemKey correctly and Item isn't isSelected", () => {
        if (selector._item) selector._item.selectedBy = new Set();

        expect(selector.hasSelected('dummyItemKey')).toBeFalsy();
      });

      it("should return true if Selector has selected itemKey correctly and Item isn't isSelected (correctlySelected = false)", () => {
        if (selector._item) selector._item.selectedBy = new Set();

        expect(selector.hasSelected('dummyItemKey', false)).toBeTruthy();
      });
    });

    describe('rebuildSelector function tests', () => {
      beforeEach(() => {
        selector.set = jest.fn();
      });

      it('should set selector value to item value (default config)', () => {
        selector._item = dummyItem1;

        selector.rebuildSelector();

        expect(selector.set).toHaveBeenCalledWith(selector._item._value, {});
      });

      it('should set selector value to item value (specific config)', () => {
        selector._item = dummyItem1;

        selector.rebuildSelector({
          sideEffects: {
            enabled: false,
          },
          background: true,
          force: true,
        });

        expect(selector.set).toHaveBeenCalledWith(selector._item._value, {
          sideEffects: {
            enabled: false,
          },
          background: true,
          force: true,
        });
      });

      it('should set selector value to undefined if Item is undefined (default config)', () => {
        selector._item = null;

        selector.rebuildSelector();

        expect(selector.set).toHaveBeenCalledWith(null, {});
      });
    });
  });
});
