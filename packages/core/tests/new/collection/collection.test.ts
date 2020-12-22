import {
  Collection,
  Agile,
  Group,
  Selector,
  Item,
  CollectionPersistent,
} from "../../../src";

describe("Collection Tests", () => {
  interface ItemInterface {
    id: string;
    name: string;
  }
  let dummyAgile: Agile;

  beforeEach(() => {
    jest.clearAllMocks();
    dummyAgile = new Agile({ localStorage: false });

    jest.spyOn(Collection.prototype, "initSelectors");
    jest.spyOn(Collection.prototype, "initGroups");
  });

  it("should create Collection (default config)", () => {
    // Overwrite methods once to not call id
    jest
      .spyOn(Collection.prototype, "initSelectors")
      .mockReturnValueOnce(undefined);
    jest
      .spyOn(Collection.prototype, "initGroups")
      .mockReturnValueOnce(undefined);

    const collection = new Collection<ItemInterface>(dummyAgile);

    expect(collection.config).toStrictEqual({
      primaryKey: "id",
      defaultGroupKey: "default",
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
  });

  it("should create Collection (specific config)", () => {
    // Overwrite methods once to not call id
    jest
      .spyOn(Collection.prototype, "initSelectors")
      .mockReturnValueOnce(undefined);
    jest
      .spyOn(Collection.prototype, "initGroups")
      .mockReturnValueOnce(undefined);

    const collection = new Collection<ItemInterface>(dummyAgile, {
      defaultGroupKey: "general",
      groups: ["group1", "group2"],
      selectors: ["selector1", "selector2"],
      key: "dummyCollectionKey",
      primaryKey: "key",
    });

    expect(collection.config).toStrictEqual({
      primaryKey: "key",
      defaultGroupKey: "general",
    });
    expect(collection.size).toBe(0);
    expect(collection.data).toStrictEqual({});
    expect(collection._key).toBe("dummyCollectionKey");
    expect(collection.isPersisted).toBeFalsy();
    expect(collection.persistent).toBeUndefined();
    expect(collection.groups).toStrictEqual({});
    expect(collection.selectors).toStrictEqual({});

    expect(Collection.prototype.initGroups).toHaveBeenCalledWith([
      "group1",
      "group2",
    ]);
    expect(Collection.prototype.initSelectors).toHaveBeenCalledWith([
      "selector1",
      "selector2",
    ]);
  });

  it("should create Collection (specific config in function form)", () => {
    // Overwrite methods once to not call id
    jest
      .spyOn(Collection.prototype, "initSelectors")
      .mockReturnValueOnce(undefined);
    jest
      .spyOn(Collection.prototype, "initGroups")
      .mockReturnValueOnce(undefined);

    const collection = new Collection<ItemInterface>(
      dummyAgile,
      (collection) => ({
        defaultGroupKey: "general",
        groups: {
          group1: collection.Group(),
        },
        selectors: {
          selector1: collection.Selector("id1"),
        },
        key: "dummyCollectionKey",
        primaryKey: "key",
      })
    );

    expect(collection.config).toStrictEqual({
      primaryKey: "key",
      defaultGroupKey: "general",
    });
    expect(collection.size).toBe(0);
    expect(collection.data).toStrictEqual({
      id1: expect.any(Item), // Placeholder Item created by Selector
    });
    expect(collection._key).toBe("dummyCollectionKey");
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
  });

  describe("Collection Function Tests", () => {
    let collection: Collection<ItemInterface>;

    beforeEach(() => {
      collection = new Collection(dummyAgile, { key: "collectionKey" });
    });

    it("should call setKey with passed value", () => {
      collection.setKey = jest.fn();

      collection.key = "newKey";

      expect(collection.setKey).toHaveBeenCalledWith("newKey");
    });

    describe("key get function tests", () => {
      it("should return current State Key", () => {
        expect(collection.key).toBe("collectionKey");
      });
    });

    describe("setKey function tests", () => {
      beforeEach(() => {
        collection.persistent = new CollectionPersistent(collection);

        collection.persistent.setKey = jest.fn();
      });

      it("should update existing Key in all instances", () => {
        collection.persistent._key = "collectionKey";

        collection.setKey("newKey");

        expect(collection._key).toBe("newKey");
        expect(collection.persistent.setKey).toHaveBeenCalledWith("newKey");
      });

      it("should update existing Key in all instances except persistent if the CollectionKey and PersistKey aren't equal", () => {
        collection.persistent._key = "randomKey";

        collection.setKey("newKey");

        expect(collection._key).toBe("newKey");
        expect(collection.persistent.setKey).not.toHaveBeenCalled();
      });

      it("should update existing Key in all instances except persistent if new CollectionKey is undefined", () => {
        collection.persistent._key = "collectionKey";

        collection.setKey(undefined);

        expect(collection._key).toBeUndefined();
        expect(collection.persistent.setKey).not.toHaveBeenCalled();
      });
    });
  });
});
