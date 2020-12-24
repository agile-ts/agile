import { Selector, Agile, Collection, StateObserver, Item } from "../../../src";

describe("Selector Tests", () => {
  interface ItemInterface {
    id: string;
    name: string;
  }
  let dummyAgile: Agile;
  let dummyCollection: Collection<ItemInterface>;

  beforeEach(() => {
    jest.clearAllMocks();
    dummyAgile = new Agile({ localStorage: false });
    dummyCollection = new Collection<ItemInterface>(dummyAgile);

    jest.spyOn(Selector.prototype, "select");
    console.warn = jest.fn();
  });

  it("should create Selector and call initial select (default config)", () => {
    // Overwrite select once to not call it
    jest.spyOn(Selector.prototype, "select").mockReturnValueOnce(undefined);

    const selector = new Selector(dummyCollection, "dummyItemKey");

    expect(selector.collection()).toBe(dummyCollection);
    expect(selector.item).toBeUndefined();
    expect(selector._itemKey).toBe("unknown");
    expect(selector.select).toHaveBeenCalledWith("dummyItemKey", {
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

  it("should create Selector and call initial select (specific config)", () => {
    // Overwrite select once to not call it
    jest.spyOn(Selector.prototype, "select").mockReturnValueOnce(undefined);

    const selector = new Selector(dummyCollection, "dummyItemKey", {
      key: "dummyKey",
    });

    expect(selector.collection()).toBe(dummyCollection);
    expect(selector.item).toBeUndefined();
    expect(selector._itemKey).toBe("unknown");
    expect(selector.select).toHaveBeenCalledWith("dummyItemKey", {
      overwrite: true,
    });

    expect(selector._key).toBe("dummyKey");
    expect(selector.valueType).toBeUndefined();
    expect(selector.isSet).toBeFalsy();
    expect(selector.isPlaceholder).toBeTruthy();
    expect(selector.initialStateValue).toBeUndefined();
    expect(selector._value).toBeUndefined();
    expect(selector.previousStateValue).toBeUndefined();
    expect(selector.nextStateValue).toBeUndefined();
    expect(selector.observer).toBeInstanceOf(StateObserver);
    expect(selector.observer.deps.size).toBe(0);
    expect(selector.observer._key).toBe("dummyKey");
    expect(selector.sideEffects).toStrictEqual({});
    expect(selector.computeMethod).toBeUndefined();
    expect(selector.isPersisted).toBeFalsy();
    expect(selector.persistent).toBeUndefined();
    expect(selector.watchers).toStrictEqual({});
  });

  it("should create Selector and shouldn't call initial select (config.isPlaceholder = true)", () => {
    // Overwrite select once to not call it
    jest.spyOn(Selector.prototype, "select").mockReturnValueOnce(undefined);

    const selector = new Selector(dummyCollection, "dummyItemKey", {
      isPlaceholder: true,
    });

    expect(selector.collection()).toBe(dummyCollection);
    expect(selector.item).toBeUndefined();
    expect(selector._itemKey).toBe("unknown");
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

  describe("Selector Function Tests", () => {
    let selector: Selector<ItemInterface>;
    let dummyItem1: Item<ItemInterface>;
    let dummyItem2: Item<ItemInterface>;

    beforeEach(() => {
      dummyCollection.collect({ id: "dummyItem1Key", name: "coolName" });
      dummyCollection.collect({ id: "dummyItem2Key", name: "coolName" });
      dummyItem1 = dummyCollection.getItem("dummyItem1Key");
      dummyItem2 = dummyCollection.getItem("dummyItem2Key");

      selector = new Selector<ItemInterface>(dummyCollection, "dummyItem1Key");
    });

    describe("itemKey set function tests", () => {
      it("should call select function with passed value", () => {
        selector.select = jest.fn();

        selector.itemKey = "newItemKey";

        expect(selector.select).toHaveBeenCalledWith("newItemKey");
      });
    });

    describe("itemKey get function tests", () => {
      it("should return current ItemKey of Selector", () => {
        selector._itemKey = "coolItemKey";

        expect(selector.itemKey).toBe("coolItemKey");
      });
    });

    describe("select function tests", () => {
      beforeEach(() => {
        jest.spyOn(selector, "rebuildSelector");
        dummyItem1.removeSideEffect = jest.fn();
        dummyItem1.addSideEffect = jest.fn();
        dummyItem2.addSideEffect = jest.fn();
      });

      it("should unselect old selected Item and select new Item (default config)", () => {
        dummyCollection.getItemWithReference = jest.fn(() => dummyItem2);

        selector.select("dummyItem2Key");

        expect(dummyCollection.getItemWithReference).toHaveBeenCalledWith(
          "dummyItem2Key"
        );
        expect(selector._itemKey).toBe("dummyItem2Key");
        expect(selector.item).toBe(dummyItem2);
        expect(dummyItem1.removeSideEffect).toHaveBeenCalledWith(
          Selector.rebuildSelectorSideEffectKey
        );
        expect(dummyItem2.addSideEffect).toHaveBeenCalledWith(
          Selector.rebuildSelectorSideEffectKey,
          expect.any(Function)
        );
        expect(selector.rebuildSelector).toHaveBeenCalledWith({
          background: false,
          sideEffects: true,
          force: false,
          overwrite: false,
          storage: true,
        });

        expect(dummyCollection.data).toHaveProperty("dummyItem1Key");
        expect(dummyCollection.data["dummyItem1Key"]).toBe(dummyItem1);
        expect(dummyCollection.data).toHaveProperty("dummyItem2Key");
        expect(dummyCollection.data["dummyItem2Key"]).toBe(dummyItem2);
      });

      it("should unselect old selected Item and select new Item (specific config)", () => {
        dummyCollection.getItemWithReference = jest.fn(() => dummyItem2);

        selector.select("dummyItem2Key", {
          force: true,
          sideEffects: false,
          background: true,
          overwrite: true,
        });

        expect(dummyCollection.getItemWithReference).toHaveBeenCalledWith(
          "dummyItem2Key"
        );
        expect(selector._itemKey).toBe("dummyItem2Key");
        expect(selector.item).toBe(dummyItem2);
        expect(dummyItem1.removeSideEffect).toHaveBeenCalledWith(
          Selector.rebuildSelectorSideEffectKey
        );
        expect(dummyItem2.addSideEffect).toHaveBeenCalledWith(
          Selector.rebuildSelectorSideEffectKey,
          expect.any(Function)
        );
        expect(selector.rebuildSelector).toHaveBeenCalledWith({
          background: true,
          sideEffects: false,
          force: true,
          overwrite: true,
          storage: true,
        });

        expect(dummyCollection.data).toHaveProperty("dummyItem1Key");
        expect(dummyCollection.data["dummyItem1Key"]).toBe(dummyItem1);
        expect(dummyCollection.data).toHaveProperty("dummyItem2Key");
        expect(dummyCollection.data["dummyItem2Key"]).toBe(dummyItem2);
      });

      it("should print warning if trying to select selected Item again (default config)", () => {
        dummyCollection.getItemWithReference = jest.fn(() => dummyItem1);

        selector.select("dummyItem1Key");

        expect(console.warn).toHaveBeenCalledWith(
          "Agile Warn: Selector has already selected 'dummyItem1Key'!"
        );

        expect(dummyCollection.getItemWithReference).toHaveBeenCalledWith(
          "dummyItem1Key"
        );
        expect(selector._itemKey).toBe("dummyItem1Key");
        expect(selector.item).toBe(dummyItem1);
        expect(dummyItem1.removeSideEffect).not.toHaveBeenCalled();
        expect(dummyItem2.addSideEffect).not.toHaveBeenCalled();
        expect(selector.rebuildSelector).not.toHaveBeenCalled();

        expect(dummyCollection.data).toHaveProperty("dummyItem1Key");
        expect(dummyCollection.data["dummyItem1Key"]).toBe(dummyItem1);
        expect(dummyCollection.data).toHaveProperty("dummyItem2Key");
        expect(dummyCollection.data["dummyItem2Key"]).toBe(dummyItem2);
      });

      it("should be able to select selected Item again (config.force = true)", () => {
        dummyCollection.getItemWithReference = jest.fn(() => dummyItem1);

        selector.select("dummyItem1Key", { force: true });

        expect(console.warn).not.toHaveBeenCalled();

        expect(dummyCollection.getItemWithReference).toHaveBeenCalledWith(
          "dummyItem1Key"
        );
        expect(selector._itemKey).toBe("dummyItem1Key");
        expect(selector.item).toBe(dummyItem1);
        expect(dummyItem1.removeSideEffect).toHaveBeenCalledWith(
          Selector.rebuildSelectorSideEffectKey
        );
        expect(dummyItem1.addSideEffect).toHaveBeenCalledWith(
          Selector.rebuildSelectorSideEffectKey,
          expect.any(Function)
        );
        expect(selector.rebuildSelector).toHaveBeenCalledWith({
          background: false,
          sideEffects: true,
          force: true,
          overwrite: false,
          storage: true,
        });

        expect(dummyCollection.data).toHaveProperty("dummyItem1Key");
        expect(dummyCollection.data["dummyItem1Key"]).toBe(dummyItem1);
        expect(dummyCollection.data).toHaveProperty("dummyItem2Key");
        expect(dummyCollection.data["dummyItem2Key"]).toBe(dummyItem2);
      });

      it("should remove old selected Item, select new Item and overwrite Selector if old Item is placeholder (default config)", async () => {
        dummyCollection.getItemWithReference = jest.fn(() => dummyItem2);
        dummyItem1.isPlaceholder = true;

        selector.select("dummyItem2Key");

        expect(dummyCollection.getItemWithReference).toHaveBeenCalledWith(
          "dummyItem2Key"
        );
        expect(selector._itemKey).toBe("dummyItem2Key");
        expect(selector.item).toBe(dummyItem2);
        expect(dummyItem1.removeSideEffect).toHaveBeenCalledWith(
          Selector.rebuildSelectorSideEffectKey
        );
        expect(dummyItem2.addSideEffect).toHaveBeenCalledWith(
          Selector.rebuildSelectorSideEffectKey,
          expect.any(Function)
        );
        expect(selector.rebuildSelector).toHaveBeenCalledWith({
          background: false,
          sideEffects: true,
          force: false,
          overwrite: true,
          storage: true,
        });

        expect(dummyCollection.data).not.toHaveProperty("dummyItem1Key");
        expect(dummyCollection.data).toHaveProperty("dummyItem2Key");
        expect(dummyCollection.data["dummyItem2Key"]).toBe(dummyItem2);
      });

      it("should remove old selected Item, select new Item and shouldn't overwrite Selector if old Item is placeholder (config.overwrite = false)", async () => {
        dummyCollection.getItemWithReference = jest.fn(() => dummyItem2);
        dummyItem1.isPlaceholder = true;

        selector.select("dummyItem2Key", { overwrite: false });

        expect(dummyCollection.getItemWithReference).toHaveBeenCalledWith(
          "dummyItem2Key"
        );
        expect(selector._itemKey).toBe("dummyItem2Key");
        expect(selector.item).toBe(dummyItem2);
        expect(dummyItem1.removeSideEffect).toHaveBeenCalledWith(
          Selector.rebuildSelectorSideEffectKey
        );
        expect(dummyItem2.addSideEffect).toHaveBeenCalledWith(
          Selector.rebuildSelectorSideEffectKey,
          expect.any(Function)
        );
        expect(selector.rebuildSelector).toHaveBeenCalledWith({
          background: false,
          sideEffects: true,
          force: false,
          overwrite: false,
          storage: true,
        });

        expect(dummyCollection.data).not.toHaveProperty("dummyItem1Key");
        expect(dummyCollection.data).toHaveProperty("dummyItem2Key");
        expect(dummyCollection.data["dummyItem2Key"]).toBe(dummyItem2);
      });

      describe("test added sideEffect called Selector.rebuildSelectorSideEffectKey", () => {
        beforeEach(() => {
          selector.rebuildSelector = jest.fn();
        });

        it("should call rebuildSelector", () => {
          selector.select("dummyItem1Key");

          dummyItem1.sideEffects[Selector.rebuildSelectorSideEffectKey]({
            dummy: "property",
          });

          expect(selector.rebuildSelector).toHaveBeenCalledWith({
            dummy: "property",
          });
        });
      });
    });

    describe("rebuildSelector function tests", () => {
      beforeEach(() => {
        selector.set = jest.fn();
      });

      it("should set selector value to item value (default config)", () => {
        selector.item = dummyItem1;

        selector.rebuildSelector();

        expect(selector.set).toHaveBeenCalledWith(selector.item._value, {});
      });

      it("should set selector value to item value (specific config)", () => {
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

      it("should set selector value to undefined if Item is undefined (default config)", () => {
        selector.item = undefined;

        selector.rebuildSelector();

        expect(selector.set).toHaveBeenCalledWith(undefined, {});
      });
    });
  });
});
