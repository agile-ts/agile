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

  it("should create Item", () => {
    // Overwrite setKey once to not call it
    jest.spyOn(Item.prototype, "setKey").mockReturnValueOnce(undefined);

    const dummyData = { id: "dummyId", name: "dummyName" };
    const item = new Item(dummyCollection, dummyData);

    expect(item.collection()).toBe(dummyCollection);
    expect(item.setKey).toHaveBeenCalledWith(
      dummyData[dummyCollection.config.primaryKey]
    );

    expect(item._key).toBeUndefined();
    expect(item.valueType).toBeUndefined();
    expect(item.isSet).toBeFalsy();
    expect(item.isPlaceholder).toBeFalsy();
    expect(item.initialStateValue).toStrictEqual(dummyData);
    expect(item._value).toStrictEqual(dummyData);
    expect(item.previousStateValue).toStrictEqual(dummyData);
    expect(item.nextStateValue).toStrictEqual(dummyData);
    expect(item.observer).toBeInstanceOf(StateObserver);
    expect(item.observer.deps.size).toBe(0);
    expect(item.observer.key).toBeUndefined();
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

      jest.spyOn(item, "removeSideEffect");
      jest.spyOn(item, "addSideEffect");
    });

    describe("setKey function tests", () => {
      it("should call State setKey and update sideEffect", () => {
        item.setKey("myNewKey");

        expect(State.prototype.setKey).toHaveBeenCalledWith("myNewKey");
        expect(item.removeSideEffect).toHaveBeenCalledWith("rebuildGroup");
        expect(item.addSideEffect).toHaveBeenCalledWith(
          "rebuildGroup",
          expect.any(Function)
        );
      });

      describe("test added sideEffect called 'rebuildGroup'", () => {
        beforeEach(() => {
          dummyCollection.rebuildGroupsThatIncludeItemKey = jest.fn();
        });

        it("should call rebuildGroupThatIncludeItemKey", () => {
          item.setKey("myNewKey");

          item.sideEffects["rebuildGroup"]({ dummy: "property" });

          expect(
            dummyCollection.rebuildGroupsThatIncludeItemKey
          ).toHaveBeenCalledWith("myNewKey", { dummy: "property" });
        });
      });
    });
  });
});
