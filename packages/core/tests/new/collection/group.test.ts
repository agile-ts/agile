import {
  Group,
  Agile,
  Collection,
  StateObserver,
  ComputedTracker,
  Item,
} from "../../../src";

describe("Group Tests", () => {
  interface ItemInterface {
    id: number;
    name: string;
  }
  let dummyAgile: Agile;
  let dummyCollection: Collection<ItemInterface>;

  beforeEach(() => {
    dummyAgile = new Agile({ localStorage: false });
    dummyCollection = new Collection<ItemInterface>(dummyAgile);

    jest.spyOn(Group.prototype, "rebuild");
    jest.spyOn(Group.prototype, "addSideEffect");
  });

  it("should create Group with no initialItems (default config)", () => {
    // Overwrite methods once to not call it
    jest.spyOn(Group.prototype, "rebuild").mockReturnValueOnce(undefined);
    jest.spyOn(Group.prototype, "addSideEffect").mockReturnValueOnce(undefined);

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
    expect(group.observer.deps.size).toBe(0);
    expect(group.observer._key).toBeUndefined();
    expect(group.sideEffects).toStrictEqual({});
    expect(group.computeMethod).toBeUndefined();
    expect(group.isPersisted).toBeFalsy();
    expect(group.persistent).toBeUndefined();
    expect(group.watchers).toStrictEqual({});
  });

  it("should create Group with no initialItems (specific config)", () => {
    // Overwrite methods once to not call it
    jest.spyOn(Group.prototype, "rebuild").mockReturnValueOnce(undefined);
    jest.spyOn(Group.prototype, "addSideEffect").mockReturnValueOnce(undefined);

    const group = new Group(dummyCollection, [], {
      key: "dummyKey",
    });

    expect(group.collection()).toBe(dummyCollection);
    expect(group._output).toStrictEqual([]);
    expect(group._items).toStrictEqual([]);
    expect(group.notFoundItemKeys).toStrictEqual([]);

    expect(group._key).toBe("dummyKey");
    expect(group.valueType).toBeUndefined();
    expect(group.isSet).toBeFalsy();
    expect(group.isPlaceholder).toBeFalsy();
    expect(group.initialStateValue).toStrictEqual([]);
    expect(group._value).toStrictEqual([]);
    expect(group.previousStateValue).toStrictEqual([]);
    expect(group.nextStateValue).toStrictEqual([]);
    expect(group.observer).toBeInstanceOf(StateObserver);
    expect(group.observer.deps.size).toBe(0);
    expect(group.observer._key).toBe("dummyKey");
    expect(group.sideEffects).toStrictEqual({});
    expect(group.computeMethod).toBeUndefined();
    expect(group.isPersisted).toBeFalsy();
    expect(group.persistent).toBeUndefined();
    expect(group.watchers).toStrictEqual({});
  });

  it("should create Group with initialItems (default config)", () => {
    // Overwrite methods once to not call it
    jest.spyOn(Group.prototype, "rebuild").mockReturnValueOnce(undefined);
    jest.spyOn(Group.prototype, "addSideEffect").mockReturnValueOnce(undefined);

    const group = new Group(dummyCollection, ["test1", "test2", "test3"]);

    expect(group.collection()).toBe(dummyCollection);
    expect(group._output).toStrictEqual([]);
    expect(group._items).toStrictEqual([]);
    expect(group.notFoundItemKeys).toStrictEqual([]);

    expect(group._key).toBeUndefined();
    expect(group.valueType).toBeUndefined();
    expect(group.isSet).toBeFalsy();
    expect(group.isPlaceholder).toBeFalsy();
    expect(group.initialStateValue).toStrictEqual(["test1", "test2", "test3"]);
    expect(group._value).toStrictEqual(["test1", "test2", "test3"]);
    expect(group.previousStateValue).toStrictEqual(["test1", "test2", "test3"]);
    expect(group.nextStateValue).toStrictEqual(["test1", "test2", "test3"]);
    expect(group.observer).toBeInstanceOf(StateObserver);
    expect(group.observer.deps.size).toBe(0);
    expect(group.observer._key).toBeUndefined();
    expect(group.sideEffects).toStrictEqual({});
    expect(group.computeMethod).toBeUndefined();
    expect(group.isPersisted).toBeFalsy();
    expect(group.persistent).toBeUndefined();
    expect(group.watchers).toStrictEqual({});
  });

  describe("Group Function Tests", () => {
    let group: Group<ItemInterface>;
    let dummyItem1: Item<ItemInterface>;
    let dummyItem2: Item<ItemInterface>;

    beforeEach(() => {
      group = new Group<ItemInterface>(dummyCollection);
      dummyItem1 = new Item<ItemInterface>(dummyCollection, {
        id: 3,
        name: "Jeff",
      });
      dummyItem2 = new Item<ItemInterface>(dummyCollection, {
        id: 4,
        name: "Frank",
      });
    });

    describe("output get function tests", () => {
      beforeEach(() => {
        jest.spyOn(ComputedTracker, "tracked");
      });

      it("should return output of Group and call ComputedTracker.tracked", () => {
        group._output = [
          { id: 1, name: "Frank" },
          { id: 2, name: "Hans" },
        ];

        const response = group.output;

        expect(response).toStrictEqual([
          { id: 1, name: "Frank" },
          { id: 2, name: "Hans" },
        ]);
        expect(ComputedTracker.tracked).toHaveBeenCalledWith(group.observer);
      });
    });

    describe("output set function tests", () => {
      it("should set output to passed value", () => {
        group.output = [
          { id: 12, name: "Hans der 3" },
          { id: 99, name: "Frank" },
        ];

        expect(group._output).toStrictEqual([
          { id: 12, name: "Hans der 3" },
          { id: 99, name: "Frank" },
        ]);
      });
    });

    describe("item get function tests", () => {
      beforeEach(() => {
        jest.spyOn(ComputedTracker, "tracked");
      });

      it("should return items of Group and call ComputedTracker.tracked", () => {
        group._items = [() => dummyItem1, () => dummyItem2];

        const response = group.items;

        expect(response).toStrictEqual([dummyItem1, dummyItem2]);
        expect(ComputedTracker.tracked).toHaveBeenCalledWith(group.observer);
      });
    });

    describe("item set function tests", () => {
      it("should set items to passed value", () => {
        group.items = [dummyItem1, dummyItem2];

        expect(group._items.length).toBe(2);
        expect(group._items[0]()).toBe(dummyItem1);
        expect(group._items[1]()).toBe(dummyItem2);
      });
    });

    describe("has function tests", () => {});
  });
});
