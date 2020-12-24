import { Item, Collection, Agile, StateObserver, State } from "../../../src";

describe("Item Tests", () => {
  let dummyAgile: Agile;
  let dummyCollection: Collection;

  beforeEach(() => {
    dummyAgile = new Agile({ localStorage: false });
    dummyCollection = new Collection(dummyAgile);

    jest.spyOn(State.prototype, "setKey");
    jest.spyOn(Item.prototype, "setKey");
  });

  it("should create Item (default config)", () => {
    // Overwrite setKey once to not call it
    jest.spyOn(Item.prototype, "setKey").mockReturnValueOnce(undefined);

    const dummyData = { id: "dummyId", name: "dummyName" };
    const item = new Item(dummyCollection, dummyData);

    expect(item.collection()).toBe(dummyCollection);
    expect(item.setKey).toHaveBeenCalledWith(
      dummyData[dummyCollection.config.primaryKey]
    );

    expect(item._key).toBe(dummyData[dummyCollection.config.primaryKey]);
    expect(item.valueType).toBeUndefined();
    expect(item.isSet).toBeFalsy();
    expect(item.isPlaceholder).toBeFalsy();
    expect(item.initialStateValue).toStrictEqual(dummyData);
    expect(item._value).toStrictEqual(dummyData);
    expect(item.previousStateValue).toStrictEqual(dummyData);
    expect(item.nextStateValue).toStrictEqual(dummyData);
    expect(item.observer).toBeInstanceOf(StateObserver);
    expect(item.observer.deps.size).toBe(0);
    expect(item.observer._key).toBe(
      dummyData[dummyCollection.config.primaryKey]
    );
    expect(item.sideEffects).toStrictEqual({});
    expect(item.computeMethod).toBeUndefined();
    expect(item.isPersisted).toBeFalsy();
    expect(item.persistent).toBeUndefined();
    expect(item.watchers).toStrictEqual({});
  });

  it("should create Item (specific config)", () => {
    // Overwrite setKey once to not call it
    jest.spyOn(Item.prototype, "setKey").mockReturnValueOnce(undefined);

    const dummyData = { id: "dummyId", name: "dummyName" };
    const item = new Item(dummyCollection, dummyData, {
      isPlaceholder: true,
    });

    expect(item.collection()).toBe(dummyCollection);
    expect(item.setKey).toHaveBeenCalledWith(
      dummyData[dummyCollection.config.primaryKey]
    );

    expect(item._key).toBe(dummyData[dummyCollection.config.primaryKey]);
    expect(item.valueType).toBeUndefined();
    expect(item.isSet).toBeFalsy();
    expect(item.isPlaceholder).toBeTruthy();
    expect(item.initialStateValue).toStrictEqual(dummyData);
    expect(item._value).toStrictEqual(dummyData);
    expect(item.previousStateValue).toStrictEqual(dummyData);
    expect(item.nextStateValue).toStrictEqual(dummyData);
    expect(item.observer).toBeInstanceOf(StateObserver);
    expect(item.observer.deps.size).toBe(0);
    expect(item.observer._key).toBe(
      dummyData[dummyCollection.config.primaryKey]
    );
    expect(item.sideEffects).toStrictEqual({});
    expect(item.computeMethod).toBeUndefined();
    expect(item.isPersisted).toBeFalsy();
    expect(item.persistent).toBeUndefined();
    expect(item.watchers).toStrictEqual({});
  });

  describe("Item Function Tests", () => {
    let item: Item;

    beforeEach(() => {
      item = new Item(dummyCollection, { id: "dummyId", name: "dummyName" });

      item.removeSideEffect = jest.fn();
      jest.spyOn(item, "addSideEffect");
      dummyCollection.rebuildGroupsThatIncludeItemKey = jest.fn();
    });

    describe("setKey function tests", () => {
      it("should call State setKey and add rebuildGroupsThatIncludeItemKey sideEffect to it", () => {
        item.setKey("myNewKey");

        expect(State.prototype.setKey).toHaveBeenCalledWith("myNewKey");
        expect(item.removeSideEffect).toHaveBeenCalledWith(
          Item.updateGroupSideEffectKey
        );
        expect(item.addSideEffect).toHaveBeenCalledWith(
          Item.updateGroupSideEffectKey,
          expect.any(Function)
        );

        expect(
          dummyCollection.rebuildGroupsThatIncludeItemKey
        ).toHaveBeenCalledWith("myNewKey");
      });

      describe("test added sideEffect called Item.updateGroupSideEffectKey", () => {
        beforeEach(() => {
          dummyCollection.rebuildGroupsThatIncludeItemKey = jest.fn();
        });

        it("should call rebuildGroupThatIncludeItemKey", () => {
          item.setKey("myNewKey");

          item.sideEffects[Item.updateGroupSideEffectKey]({
            dummy: "property",
          });

          expect(
            dummyCollection.rebuildGroupsThatIncludeItemKey
          ).toHaveBeenCalledWith("myNewKey", { dummy: "property" });
        });
      });
    });
  });
});
