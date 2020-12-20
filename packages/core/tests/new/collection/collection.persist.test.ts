import { Agile, CollectionPersistent, Collection } from "../../../src";

describe("CollectionPersist Tests", () => {
  let dummyAgile: Agile;
  let dummyCollection: Collection;

  beforeEach(() => {
    jest.clearAllMocks();

    dummyAgile = new Agile({ localStorage: false });
    dummyCollection = new Collection(dummyAgile);

    jest.spyOn(CollectionPersistent.prototype, "instantiatePersistent");
    jest.spyOn(CollectionPersistent.prototype, "initialLoading");
    console.error = jest.fn();
  });

  it("should create CollectionPersistent and shouldn't call initialLoading if Persistent isn't ready (default config)", () => {
    // Overwrite instantiatePersistent once to not call it and set ready property
    jest
      .spyOn(CollectionPersistent.prototype, "instantiatePersistent")
      .mockImplementationOnce(function () {
        this.ready = false;
      });

    const collectionPersistent = new CollectionPersistent(dummyCollection);

    expect(collectionPersistent).toBeInstanceOf(CollectionPersistent);
    expect(collectionPersistent.collection()).toBe(dummyCollection);
    expect(collectionPersistent.instantiatePersistent).toHaveBeenCalledWith({
      key: undefined,
      storageKeys: [],
    });
    expect(collectionPersistent.initialLoading).not.toHaveBeenCalled();

    expect(collectionPersistent._key).toBe(CollectionPersistent.placeHolderKey);
    expect(collectionPersistent.ready).toBeFalsy();
    expect(collectionPersistent.isPersisted).toBeFalsy();
    expect(collectionPersistent.onLoad).toBeUndefined();
    expect(collectionPersistent.storageKeys).toStrictEqual([]);
    expect(collectionPersistent.defaultStorageKey).toBeUndefined();
  });

  it("should create CollectionPersistent and shouldn't call initialLoading if Persistent isn't ready (specific config)", () => {
    // Overwrite instantiatePersistent once to not call it and set ready property
    jest
      .spyOn(CollectionPersistent.prototype, "instantiatePersistent")
      .mockImplementationOnce(function () {
        this.ready = false;
      });

    const collectionPersistent = new CollectionPersistent(dummyCollection, {
      key: "collectionPersistentKey",
      storageKeys: ["test1", "test2"],
    });

    expect(collectionPersistent).toBeInstanceOf(CollectionPersistent);
    expect(collectionPersistent.instantiatePersistent).toHaveBeenCalledWith({
      key: "collectionPersistentKey",
      storageKeys: ["test1", "test2"],
    });
    expect(collectionPersistent.initialLoading).not.toHaveBeenCalled();

    expect(collectionPersistent._key).toBe(CollectionPersistent.placeHolderKey);
    expect(collectionPersistent.ready).toBeFalsy();
    expect(collectionPersistent.isPersisted).toBeFalsy();
    expect(collectionPersistent.onLoad).toBeUndefined();
    expect(collectionPersistent.storageKeys).toStrictEqual([]);
    expect(collectionPersistent.defaultStorageKey).toBeUndefined();
  });

  it("should create CollectionPersistent and should call initialLoading if Persistent is ready (default config)", () => {
    // Overwrite instantiatePersistent once to not call it
    jest
      .spyOn(CollectionPersistent.prototype, "instantiatePersistent")
      .mockImplementationOnce(function () {
        this.ready = true;
      });

    const collectionPersistent = new CollectionPersistent(dummyCollection);

    expect(collectionPersistent.initialLoading).toHaveBeenCalled();
  });

  it("should create CollectionPersistent and shouldn't call initialLoading if Persistent is ready (config.instantiate = false)", () => {
    // Overwrite instantiatePersistent once to not call it and set ready property
    jest
      .spyOn(CollectionPersistent.prototype, "instantiatePersistent")
      .mockImplementationOnce(function () {
        this.ready = true;
      });

    const collectionPersistent = new CollectionPersistent(dummyCollection, {
      instantiate: false,
    });

    expect(collectionPersistent.initialLoading).not.toHaveBeenCalled();
  });

  describe("CollectionPersistent Function Tests", () => {
    // TODO
  });
});
