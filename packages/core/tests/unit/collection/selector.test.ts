import {Selector, Agile, Collection, StateObserver, Item} from '../../../src';

describe('Selector Tests', () => {
  interface ItemInterface {
    id: string;
    name: string;
  }

  let dummyAgile: Agile;
  let dummyCollection: Collection<ItemInterface>;

  beforeEach(() => {
    jest.clearAllMocks();
    dummyAgile = new Agile({localStorage: false});
    dummyCollection = new Collection<ItemInterface>(dummyAgile);

    jest.spyOn(Selector.prototype, 'select');
    console.warn = jest.fn();
  });

  it('should create Selector and call initial select (default config)', () => {
    // Overwrite select once to not call it
    jest.spyOn(Selector.prototype, 'select').mockReturnValueOnce(undefined);

    const selector = new Selector(dummyCollection, 'dummyItemKey');

    expect(selector.collection()).toBe(dummyCollection);
    expect(selector.item).toBeUndefined();
    expect(selector._itemKey).toBe(Selector.dummyItemKey);
    expect(selector.select).toHaveBeenCalledWith('dummyItemKey', {
      overwrite: true,
    });

    expect(selector._key).toBeUndefined();
    expect(selector.valueType).toBeUndefined();
    expect(selector.isSet).toBeFalsy();
    expect(selector.isPlaceholder).toBeTruthy();
    expect(selector.initialStateValue).toBeUndefined();
    expect(selector._value).toBeUndefined();
    expect(selector.previousStateValue).toBeUndefined();
    expect(selector.nextStateValue).toBeUndefined();
    expect(selector.observer).toBeInstanceOf(StateObserver);
    expect(selector.observer.deps.size).toBe(0);
    expect(selector.observer._key).toBeUndefined();
    expect(selector.sideEffects).toStrictEqual({});
    expect(selector.computeMethod).toBeUndefined();
    expect(selector.isPersisted).toBeFalsy();
    expect(selector.persistent).toBeUndefined();
    expect(selector.watchers).toStrictEqual({});
  });

  it('should create Selector and call initial select (specific config)', () => {
    // Overwrite select once to not call it
    jest.spyOn(Selector.prototype, 'select').mockReturnValueOnce(undefined);

    const selector = new Selector(dummyCollection, 'dummyItemKey', {
      key: 'dummyKey',
    });

    expect(selector.collection()).toBe(dummyCollection);
    expect(selector.item).toBeUndefined();
    expect(selector._itemKey).toBe(Selector.dummyItemKey);
    expect(selector.select).toHaveBeenCalledWith('dummyItemKey', {
      overwrite: true,
    });

    expect(selector._key).toBe('dummyKey');
    expect(selector.valueType).toBeUndefined();
    expect(selector.isSet).toBeFalsy();
    expect(selector.isPlaceholder).toBeTruthy();
    expect(selector.initialStateValue).toBeUndefined();
    expect(selector._value).toBeUndefined();
    expect(selector.previousStateValue).toBeUndefined();
    expect(selector.nextStateValue).toBeUndefined();
    expect(selector.observer).toBeInstanceOf(StateObserver);
    expect(selector.observer.deps.size).toBe(0);
    expect(selector.observer._key).toBe('dummyKey');
    expect(selector.sideEffects).toStrictEqual({});
    expect(selector.computeMethod).toBeUndefined();
    expect(selector.isPersisted).toBeFalsy();
    expect(selector.persistent).toBeUndefined();
    expect(selector.watchers).toStrictEqual({});
  });

  it("should create Selector and shouldn't call initial select (config.isPlaceholder = true)", () => {
    // Overwrite select once to not call it
    jest.spyOn(Selector.prototype, 'select').mockReturnValueOnce(undefined);

    const selector = new Selector(dummyCollection, 'dummyItemKey', {
      isPlaceholder: true,
    });

    expect(selector.collection()).toBe(dummyCollection);
    expect(selector.item).toBeUndefined();
    expect(selector._itemKey).toBe(Selector.dummyItemKey);
    expect(selector.select).not.toHaveBeenCalled();

    expect(selector._key).toBeUndefined();
    expect(selector.valueType).toBeUndefined();
    expect(selector.isSet).toBeFalsy();
    expect(selector.isPlaceholder).toBeTruthy();
    expect(selector.initialStateValue).toBeUndefined();
    expect(selector._value).toBeUndefined();
    expect(selector.previousStateValue).toBeUndefined();
    expect(selector.nextStateValue).toBeUndefined();
    expect(selector.observer).toBeInstanceOf(StateObserver);
    expect(selector.observer.deps.size).toBe(0);
    expect(selector.observer._key).toBeUndefined();
    expect(selector.sideEffects).toStrictEqual({});
    expect(selector.computeMethod).toBeUndefined();
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
      it('should call select function with passed value', () => {
        selector.select = jest.fn();

        selector.itemKey = 'newItemKey';

        expect(selector.select).toHaveBeenCalledWith('newItemKey');
      });
    });

    describe('itemKey get function tests', () => {
      it('should return current ItemKey of Selector', () => {
        selector._itemKey = 'coolItemKey';

        expect(selector.itemKey).toBe('coolItemKey');
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
      });

      it('should unselect old selected Item and select new Item (default config)', () => {
        dummyCollection.getItemWithReference = jest.fn(() => dummyItem2);

        selector.select('dummyItem2');

        expect(dummyCollection.getItemWithReference).toHaveBeenCalledWith(
          'dummyItem2',
        );

        expect(selector._itemKey).toBe('dummyItem2');
        expect(selector.item).toBe(dummyItem2);
        expect(selector.unselect).toHaveBeenCalledWith({background: true});
        expect(selector.rebuildSelector).toHaveBeenCalledWith({
          background: false,
          sideEffects: true,
          force: false,
          overwrite: false,
          storage: true,
        });

        expect(dummyItem2.addSideEffect).toHaveBeenCalledWith(
          Selector.rebuildSelectorSideEffectKey,
          expect.any(Function),
        );
        expect(dummyItem2.isSelected).toBeTruthy();
      });

      it('should unselect old selected Item and select new Item (specific config)', () => {
        dummyCollection.getItemWithReference = jest.fn(() => dummyItem2);

        selector.select('dummyItem2', {
          force: true,
          sideEffects: false,
          background: true,
          overwrite: true,
        });

        expect(dummyCollection.getItemWithReference).toHaveBeenCalledWith(
          'dummyItem2',
        );

        expect(selector._itemKey).toBe('dummyItem2');
        expect(selector.item).toBe(dummyItem2);
        expect(selector.unselect).toHaveBeenCalledWith({background: true});
        expect(selector.rebuildSelector).toHaveBeenCalledWith({
          background: true,
          sideEffects: false,
          force: true,
          overwrite: true,
          storage: true,
        });

        expect(dummyItem2.addSideEffect).toHaveBeenCalledWith(
          Selector.rebuildSelectorSideEffectKey,
          expect.any(Function),
        );
        expect(dummyItem2.isSelected).toBeTruthy();
      });

      it('should print warning if trying to select selected Item again (default config)', () => {
        dummyCollection.getItemWithReference = jest.fn(() => dummyItem1);

        selector.select('dummyItem1');

        expect(console.warn).toHaveBeenCalledWith(
          "Agile Warn: Selector has already selected 'dummyItem1'!",
        );

        expect(dummyCollection.getItemWithReference).toHaveBeenCalledWith(
          'dummyItem1',
        );
        expect(selector._itemKey).toBe('dummyItem1');
        expect(selector.item).toBe(dummyItem1);
        expect(selector.unselect).not.toHaveBeenCalled();
        expect(selector.rebuildSelector).not.toHaveBeenCalled();

        expect(dummyItem1.addSideEffect).not.toHaveBeenCalled();
        expect(dummyItem1.isSelected).toBeTruthy();
      });

      it('should be able to select selected Item again (config.force = true)', () => {
        dummyCollection.getItemWithReference = jest.fn(() => dummyItem1);

        selector.select('dummyItem1', {force: true});

        expect(console.warn).not.toHaveBeenCalled();

        expect(dummyCollection.getItemWithReference).toHaveBeenCalledWith(
          'dummyItem1',
        );

        expect(selector._itemKey).toBe('dummyItem1');
        expect(selector.item).toBe(dummyItem1);
        expect(selector.unselect).toHaveBeenCalledWith({background: true});
        expect(selector.rebuildSelector).toHaveBeenCalledWith({
          background: false,
          sideEffects: true,
          force: true,
          overwrite: false,
          storage: true,
        });

        expect(dummyItem1.addSideEffect).toHaveBeenCalledWith(
          Selector.rebuildSelectorSideEffectKey,
          expect.any(Function),
        );
        expect(dummyItem1.isSelected).toBeTruthy();
      });

      it('should remove old selected Item, select new Item and overwrite Selector if old Item is placeholder (default config)', async () => {
        dummyCollection.getItemWithReference = jest.fn(() => dummyItem2);
        dummyItem1.isPlaceholder = true;

        selector.select('dummyItem2');

        expect(dummyCollection.getItemWithReference).toHaveBeenCalledWith(
          'dummyItem2',
        );
        expect(selector._itemKey).toBe('dummyItem2');
        expect(selector.item).toBe(dummyItem2);
        expect(selector.unselect).toHaveBeenCalledWith({background: true});
        expect(selector.rebuildSelector).toHaveBeenCalledWith({
          background: false,
          sideEffects: true,
          force: false,
          overwrite: true,
          storage: true,
        });

        expect(dummyItem2.addSideEffect).toHaveBeenCalledWith(
          Selector.rebuildSelectorSideEffectKey,
          expect.any(Function),
        );
        expect(dummyItem2.isSelected).toBeTruthy();
      });

      it("should remove old selected Item, select new Item and shouldn't overwrite Selector if old Item is placeholder (config.overwrite = false)", async () => {
        dummyCollection.getItemWithReference = jest.fn(() => dummyItem2);
        dummyItem1.isPlaceholder = true;

        selector.select('dummyItem2', {overwrite: false});

        expect(dummyCollection.getItemWithReference).toHaveBeenCalledWith(
          'dummyItem2',
        );
        expect(selector._itemKey).toBe('dummyItem2');
        expect(selector.item).toBe(dummyItem2);
        expect(selector.unselect).toHaveBeenCalledWith({background: true});
        expect(selector.rebuildSelector).toHaveBeenCalledWith({
          background: false,
          sideEffects: true,
          force: false,
          overwrite: false,
          storage: true,
        });

        expect(dummyItem2.addSideEffect).toHaveBeenCalledWith(
          Selector.rebuildSelectorSideEffectKey,
          expect.any(Function),
        );
        expect(dummyItem2.isSelected).toBeTruthy();
      });

      describe('test added sideEffect called Selector.rebuildSelectorSideEffectKey', () => {
        beforeEach(() => {
          selector.rebuildSelector = jest.fn();
        });

        it('should call rebuildSelector', () => {
          selector.select('dummyItem1');

          dummyItem1.sideEffects[Selector.rebuildSelectorSideEffectKey]({
            dummy: 'property',
          });

          expect(selector.rebuildSelector).toHaveBeenCalledWith({
            dummy: 'property',
          });
        });
      });
    });

    describe('unselect function tests', () => {
      beforeEach(() => {
        selector.rebuildSelector = jest.fn();
        dummyItem1.removeSideEffect = jest.fn();
      });

      it("should unselect current selected Item and shouldn't remove it from Collection (default config)", () => {
        selector.unselect();

        expect(dummyItem1.isSelected).toBeFalsy();
        expect(dummyItem1.removeSideEffect).toHaveBeenCalledWith(
          Selector.rebuildSelectorSideEffectKey,
        );

        expect(selector.item).toBeUndefined();
        expect(selector._itemKey).toBe(Selector.dummyItemKey);
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

        expect(dummyItem1.isSelected).toBeFalsy();
        expect(dummyItem1.removeSideEffect).toHaveBeenCalledWith(
          Selector.rebuildSelectorSideEffectKey,
        );

        expect(selector.item).toBeUndefined();
        expect(selector._itemKey).toBe(Selector.dummyItemKey);
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

        expect(dummyItem1.isSelected).toBeFalsy();
        expect(dummyItem1.removeSideEffect).toHaveBeenCalledWith(
          Selector.rebuildSelectorSideEffectKey,
        );

        expect(selector.item).toBeUndefined();
        expect(selector._itemKey).toBe(Selector.dummyItemKey);
        expect(selector.isPlaceholder).toBeTruthy();
        expect(selector.rebuildSelector).toHaveBeenCalledWith({});

        expect(dummyCollection.data).not.toHaveProperty('dummyItem1');
      });
    });

    describe('hasSelected function tests', () => {
      beforeEach(() => {
        selector._itemKey = 'dummyItemKey';
      });

      it('should return true if Selector has selected ItemKey and Item isSelected', () => {
        selector.item.isSelected = true;

        expect(selector.hasSelected('dummyItemKey')).toBeTruthy();
      });

      it("should return false if Selector hasn't selected ItemKey and Item isSelected", () => {
        selector.item.isSelected = true;

        expect(selector.hasSelected('notSelectedItemKey')).toBeFalsy();
      });

      it("should return false if Selector has selected ItemKey and Item isn't isSelected", () => {
        selector.item.isSelected = false;

        expect(selector.hasSelected('dummyItemKey')).toBeFalsy();
      });

      it("should return false if Selector hasn't selected ItemKey and Item isn't isSelected", () => {
        selector.item.isSelected = false;

        expect(selector.hasSelected('notSelectedItemKey')).toBeFalsy();
      });
    });

    describe('rebuildSelector function tests', () => {
      beforeEach(() => {
        selector.set = jest.fn();
      });

      it('should set selector value to item value (default config)', () => {
        selector.item = dummyItem1;

        selector.rebuildSelector();

        expect(selector.set).toHaveBeenCalledWith(selector.item._value, {});
      });

      it('should set selector value to item value (specific config)', () => {
        selector.item = dummyItem1;

        selector.rebuildSelector({
          sideEffects: false,
          background: true,
          force: true,
        });

        expect(selector.set).toHaveBeenCalledWith(selector.item._value, {
          sideEffects: false,
          background: true,
          force: true,
        });
      });

      it('should set selector value to undefined if Item is undefined (default config)', () => {
        selector.item = undefined;

        selector.rebuildSelector();

        expect(selector.set).toHaveBeenCalledWith(undefined, {});
      });
    });
  });
});
