import { Item, Collection, Agile, StateObserver, State } from '../../../src';

describe('Item Tests', () => {
  let dummyAgile: Agile;
  let dummyCollection: Collection;

  beforeEach(() => {
    dummyAgile = new Agile({ localStorage: false });
    dummyCollection = new Collection(dummyAgile);

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
    expect(item.observer).toBeInstanceOf(StateObserver);
    expect(item.observer.dependents.size).toBe(0);
    expect(item.observer._key).toBe(
      dummyData[dummyCollection.config.primaryKey]
    );
    expect(item.sideEffects).toStrictEqual({});
    expect(item.computeValueMethod).toBeUndefined();
    expect(item.computeExistsMethod).toBeInstanceOf(Function);
    expect(item.isPersisted).toBeFalsy();
    expect(item.persistent).toBeUndefined();
    expect(item.watchers).toStrictEqual({});
    expect(item.isSelected).toBeFalsy();
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

    expect(item._key).toBe(dummyData[dummyCollection.config.primaryKey]);
    expect(item.valueType).toBeUndefined();
    expect(item.isSet).toBeFalsy();
    expect(item.isPlaceholder).toBeTruthy();
    expect(item.initialStateValue).toStrictEqual(dummyData);
    expect(item._value).toStrictEqual(dummyData);
    expect(item.previousStateValue).toStrictEqual(dummyData);
    expect(item.nextStateValue).toStrictEqual(dummyData);
    expect(item.observer).toBeInstanceOf(StateObserver);
    expect(item.observer.dependents.size).toBe(0);
    expect(item.observer._key).toBe(
      dummyData[dummyCollection.config.primaryKey]
    );
    expect(item.sideEffects).toStrictEqual({});
    expect(item.computeValueMethod).toBeUndefined();
    expect(item.computeExistsMethod).toBeInstanceOf(Function);
    expect(item.isPersisted).toBeFalsy();
    expect(item.persistent).toBeUndefined();
    expect(item.watchers).toStrictEqual({});
    expect(item.isSelected).toBeFalsy();
  });

  describe('Item Function Tests', () => {
    let item: Item;

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
