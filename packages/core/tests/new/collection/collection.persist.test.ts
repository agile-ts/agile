import {
  Agile,
  CollectionPersistent,
  Collection,
  Storage,
  Persistent,
  StatePersistent,
  Group,
  Item,
} from "../../../src";

describe("CollectionPersist Tests", () => {
  interface ItemInterface {
    id: string;
    name: string;
  }
  let dummyAgile: Agile;
  let dummyCollection: Collection<ItemInterface>;

  beforeEach(() => {
    jest.clearAllMocks();

    dummyAgile = new Agile({ localStorage: false });
    dummyCollection = new Collection<ItemInterface>(dummyAgile, {
      key: "dummyCollectionKey",
    });

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
    let collectionPersistent: CollectionPersistent;

    beforeEach(() => {
      collectionPersistent = new CollectionPersistent(dummyCollection, {
        key: "collectionPersistentKey",
        storageKeys: ["dummyStorage"],
      });
      dummyAgile.registerStorage(
        new Storage({
          key: "dummyStorage",
          methods: {
            get: jest.fn(),
            remove: jest.fn(),
            set: jest.fn(),
          },
        })
      );
    });

    describe("setKey function tests", () => {
      beforeEach(() => {
        collectionPersistent.removePersistedValue = jest.fn();
        collectionPersistent.persistValue = jest.fn();
        collectionPersistent.initialLoading = jest.fn();
        jest.spyOn(collectionPersistent, "validatePersistent");
      });

      it("should update key with valid key in ready Persistent", async () => {
        collectionPersistent.ready = true;
        collectionPersistent._key = "dummyKey";

        await collectionPersistent.setKey("newKey");

        expect(collectionPersistent._key).toBe("newKey");
        expect(collectionPersistent.ready).toBeTruthy();
        expect(collectionPersistent.validatePersistent).toHaveBeenCalled();
        expect(collectionPersistent.initialLoading).not.toHaveBeenCalled();
        expect(collectionPersistent.persistValue).toHaveBeenCalledWith(
          "newKey"
        );
        expect(collectionPersistent.removePersistedValue).toHaveBeenCalledWith(
          "dummyKey"
        );
      });

      it("should update key with not valid key in ready Persistent", async () => {
        collectionPersistent.ready = true;
        collectionPersistent._key = "dummyKey";

        await collectionPersistent.setKey();

        expect(collectionPersistent._key).toBe(
          CollectionPersistent.placeHolderKey
        );
        expect(collectionPersistent.ready).toBeFalsy();
        expect(collectionPersistent.validatePersistent).toHaveBeenCalled();
        expect(collectionPersistent.initialLoading).not.toHaveBeenCalled();
        expect(collectionPersistent.persistValue).not.toHaveBeenCalled();
        expect(collectionPersistent.removePersistedValue).toHaveBeenCalledWith(
          "dummyKey"
        );
      });

      it("should update key with valid key in not ready Persistent", async () => {
        collectionPersistent.ready = false;

        await collectionPersistent.setKey("newKey");

        expect(collectionPersistent._key).toBe("newKey");
        expect(collectionPersistent.ready).toBeTruthy();
        expect(collectionPersistent.validatePersistent).toHaveBeenCalled();
        expect(collectionPersistent.initialLoading).toHaveBeenCalled();
        expect(collectionPersistent.persistValue).not.toHaveBeenCalled();
        expect(
          collectionPersistent.removePersistedValue
        ).not.toHaveBeenCalled();
      });

      it("should update key with not valid key in not ready Persistent", async () => {
        collectionPersistent.ready = false;

        await collectionPersistent.setKey();

        expect(collectionPersistent._key).toBe(
          CollectionPersistent.placeHolderKey
        );
        expect(collectionPersistent.ready).toBeFalsy();
        expect(collectionPersistent.validatePersistent).toHaveBeenCalled();
        expect(collectionPersistent.initialLoading).not.toHaveBeenCalled();
        expect(collectionPersistent.persistValue).not.toHaveBeenCalled();
        expect(
          collectionPersistent.removePersistedValue
        ).not.toHaveBeenCalled();
      });
    });

    describe("initialLoading function tests", () => {
      beforeEach(() => {
        jest.spyOn(Persistent.prototype, "initialLoading");
      });

      it("should initialLoad and set isPersisted in Collection to true", async () => {
        await collectionPersistent.initialLoading();

        expect(Persistent.prototype.initialLoading).toHaveBeenCalled();
        expect(dummyCollection.isPersisted).toBeTruthy();
      });
    });

    describe("loadPersistedValue function tests", () => {
      let dummyDefaultGroup: Group;

      beforeEach(() => {
        collectionPersistent.defaultStorageKey = "test";

        dummyDefaultGroup = new Group(dummyCollection, ["1", "2", "3"]);
        dummyDefaultGroup.persistent = new StatePersistent(dummyDefaultGroup);
        dummyDefaultGroup.persistent.ready = true;

        collectionPersistent.persistValue = jest.fn();

        dummyDefaultGroup.persist = jest.fn();
        dummyDefaultGroup.persistent.initialLoading = jest.fn();

        dummyCollection.collect = jest.fn();
      });

      it("should load default Group and its Items with the persistentKey and apply it to the Collection if loading was successful", async () => {
        collectionPersistent.ready = true;
        dummyAgile.storages.get = jest
          .fn()
          .mockReturnValueOnce(Promise.resolve(true))
          .mockReturnValueOnce({ id: "1", name: "hans" })
          .mockReturnValueOnce(undefined)
          .mockReturnValueOnce({ id: "3", name: "frank" });
        dummyCollection.getGroup = jest.fn(() => dummyDefaultGroup as any);

        const response = await collectionPersistent.loadPersistedValue();

        expect(response).toBeTruthy();

        expect(dummyCollection.getGroup).toHaveBeenCalledWith(
          dummyCollection.config.defaultGroupKey
        );

        expect(dummyAgile.storages.get).toHaveBeenCalledWith(
          collectionPersistent._key,
          collectionPersistent.defaultStorageKey
        );
        expect(dummyAgile.storages.get).toHaveBeenCalledWith(
          CollectionPersistent.getItemStorageKey(
            "1",
            collectionPersistent._key
          ),
          collectionPersistent.defaultStorageKey
        );
        expect(dummyAgile.storages.get).toHaveBeenCalledWith(
          CollectionPersistent.getItemStorageKey(
            "2",
            collectionPersistent._key
          ),
          collectionPersistent.defaultStorageKey
        );
        expect(dummyAgile.storages.get).toHaveBeenCalledWith(
          CollectionPersistent.getItemStorageKey(
            "3",
            collectionPersistent._key
          ),
          collectionPersistent.defaultStorageKey
        );

        expect(dummyDefaultGroup.persist).toHaveBeenCalledWith({
          instantiate: false,
          followCollectionPersistKeyPattern: true,
        });
        expect(dummyDefaultGroup.persistent.initialLoading).toHaveBeenCalled();
        expect(dummyDefaultGroup.isPersisted).toBeTruthy();

        expect(dummyCollection.collect).toHaveBeenCalledWith({
          id: "1",
          name: "hans",
        });
        expect(dummyCollection.collect).not.toHaveBeenCalledWith(undefined);
        expect(dummyCollection.collect).toHaveBeenCalledWith({
          id: "3",
          name: "frank",
        });

        expect(collectionPersistent.persistValue).toHaveBeenCalledWith(
          collectionPersistent._key
        );
      });

      it("shouldn't load default Group and its Items with the persistentKey and shouldn't apply it to the Collection if loading wasn't successful", async () => {
        collectionPersistent.ready = true;
        dummyAgile.storages.get = jest
          .fn()
          .mockReturnValueOnce(Promise.resolve(undefined));
        dummyCollection.getGroup = jest.fn(() => dummyDefaultGroup as any);

        const response = await collectionPersistent.loadPersistedValue();

        expect(response).toBeFalsy();

        expect(dummyCollection.getGroup).not.toHaveBeenCalled();

        expect(dummyAgile.storages.get).toHaveBeenCalledWith(
          collectionPersistent._key,
          collectionPersistent.defaultStorageKey
        );
        expect(dummyAgile.storages.get).not.toHaveBeenCalledWith(
          CollectionPersistent.getItemStorageKey(
            "1",
            collectionPersistent._key
          ),
          collectionPersistent.defaultStorageKey
        );
        expect(dummyAgile.storages.get).not.toHaveBeenCalledWith(
          CollectionPersistent.getItemStorageKey(
            "2",
            collectionPersistent._key
          ),
          collectionPersistent.defaultStorageKey
        );
        expect(dummyAgile.storages.get).not.toHaveBeenCalledWith(
          CollectionPersistent.getItemStorageKey(
            "3",
            collectionPersistent._key
          ),
          collectionPersistent.defaultStorageKey
        );

        expect(dummyDefaultGroup.persist).not.toHaveBeenCalled();
        expect(
          dummyDefaultGroup.persistent.initialLoading
        ).not.toHaveBeenCalled();
        expect(dummyDefaultGroup.isPersisted).toBeFalsy();

        expect(dummyCollection.collect).not.toHaveBeenCalled();

        expect(collectionPersistent.persistValue).not.toHaveBeenCalled();
      });

      it("should load default Group and its Items with a specific Key and should apply it to the Collection if loading was successful", async () => {
        collectionPersistent.ready = true;
        dummyAgile.storages.get = jest
          .fn()
          .mockReturnValueOnce(Promise.resolve(true))
          .mockReturnValueOnce({ id: "1", name: "hans" })
          .mockReturnValueOnce(undefined)
          .mockReturnValueOnce({ id: "3", name: "frank" });
        dummyCollection.getGroup = jest.fn(() => dummyDefaultGroup as any);

        const response = await collectionPersistent.loadPersistedValue(
          "dummyKey"
        );

        expect(response).toBeTruthy();

        expect(dummyCollection.getGroup).toHaveBeenCalledWith(
          dummyCollection.config.defaultGroupKey
        );

        expect(dummyAgile.storages.get).toHaveBeenCalledWith(
          "dummyKey",
          collectionPersistent.defaultStorageKey
        );
        expect(dummyAgile.storages.get).toHaveBeenCalledWith(
          CollectionPersistent.getItemStorageKey("1", "dummyKey"),
          collectionPersistent.defaultStorageKey
        );
        expect(dummyAgile.storages.get).toHaveBeenCalledWith(
          CollectionPersistent.getItemStorageKey("2", "dummyKey"),
          collectionPersistent.defaultStorageKey
        );
        expect(dummyAgile.storages.get).toHaveBeenCalledWith(
          CollectionPersistent.getItemStorageKey("3", "dummyKey"),
          collectionPersistent.defaultStorageKey
        );

        expect(dummyDefaultGroup.persist).toHaveBeenCalledWith({
          instantiate: false,
          followCollectionPersistKeyPattern: true,
        });
        expect(dummyDefaultGroup.persistent.initialLoading).toHaveBeenCalled();
        expect(dummyDefaultGroup.isPersisted).toBeTruthy();

        expect(dummyCollection.collect).toHaveBeenCalledWith({
          id: "1",
          name: "hans",
        });
        expect(dummyCollection.collect).not.toHaveBeenCalledWith(undefined);
        expect(dummyCollection.collect).toHaveBeenCalledWith({
          id: "3",
          name: "frank",
        });

        expect(collectionPersistent.persistValue).toHaveBeenCalledWith(
          "dummyKey"
        );
      });

      it("shouldn't load default Group and its Items if Persistent isn't ready", async () => {
        collectionPersistent.ready = false;
        dummyAgile.storages.get = jest.fn(() =>
          Promise.resolve(undefined as any)
        );
        dummyCollection.getGroup = jest.fn(() => dummyDefaultGroup as any);

        const response = await collectionPersistent.loadPersistedValue();

        expect(response).toBeFalsy();

        expect(dummyCollection.getGroup).not.toHaveBeenCalled();

        expect(dummyAgile.storages.get).not.toHaveBeenCalled();

        expect(dummyDefaultGroup.persist).not.toHaveBeenCalled();
        expect(
          dummyDefaultGroup.persistent.initialLoading
        ).not.toHaveBeenCalled();
        expect(dummyDefaultGroup.isPersisted).toBeFalsy();

        expect(dummyCollection.collect).not.toHaveBeenCalled();

        expect(collectionPersistent.persistValue).not.toHaveBeenCalled();
      });

      it("shouldn't load default Group and its Items if Collection has no defaultGroup", async () => {
        collectionPersistent.ready = true;
        dummyCollection.groups = {};
        dummyAgile.storages.get = jest
          .fn()
          .mockReturnValueOnce(Promise.resolve(true));
        dummyCollection.getGroup = jest.fn(() => undefined);

        const response = await collectionPersistent.loadPersistedValue();

        expect(response).toBeFalsy();

        expect(dummyCollection.getGroup).toHaveBeenCalledWith(
          dummyCollection.config.defaultGroupKey
        );

        expect(dummyAgile.storages.get).toHaveBeenCalledWith(
          collectionPersistent._key,
          collectionPersistent.defaultStorageKey
        );
        expect(dummyAgile.storages.get).not.toHaveBeenCalledWith(
          CollectionPersistent.getItemStorageKey(
            "1",
            collectionPersistent._key
          ),
          collectionPersistent.defaultStorageKey
        );
        expect(dummyAgile.storages.get).not.toHaveBeenCalledWith(
          CollectionPersistent.getItemStorageKey(
            "2",
            collectionPersistent._key
          ),
          collectionPersistent.defaultStorageKey
        );
        expect(dummyAgile.storages.get).not.toHaveBeenCalledWith(
          CollectionPersistent.getItemStorageKey(
            "3",
            collectionPersistent._key
          ),
          collectionPersistent.defaultStorageKey
        );

        expect(dummyDefaultGroup.persist).not.toHaveBeenCalled();
        expect(
          dummyDefaultGroup.persistent.initialLoading
        ).not.toHaveBeenCalled();
        expect(dummyDefaultGroup.isPersisted).toBeFalsy();

        expect(dummyCollection.collect).not.toHaveBeenCalled();

        expect(collectionPersistent.persistValue).not.toHaveBeenCalled();
      });
    });

    describe("persistValue function tests", () => {
      let dummyDefaultGroup: Group;
      let dummyItem1: Item<ItemInterface>;
      let dummyItem3: Item<ItemInterface>;

      beforeEach(() => {
        collectionPersistent.storageKeys = ["test1", "test2"];
        collectionPersistent.isPersisted = undefined;

        dummyItem1 = new Item<ItemInterface>(dummyCollection, {
          id: "1",
          name: "frank",
        });
        dummyItem3 = new Item<ItemInterface>(dummyCollection, {
          id: "3",
          name: "hans",
        });

        dummyDefaultGroup = new Group(dummyCollection, ["1", "2", "3"]);
        dummyCollection.data = {
          ["1"]: dummyItem1,
          ["3"]: dummyItem3,
        };

        dummyDefaultGroup.persist = jest.fn();
        jest.spyOn(dummyDefaultGroup, "addSideEffect");

        dummyItem1.persist = jest.fn();
        dummyItem3.persist = jest.fn();

        dummyCollection.collect = jest.fn();

        dummyAgile.storages.set = jest.fn();
      });

      it("should persist defaultGroup and its Items with persistentKey", async () => {
        collectionPersistent.ready = true;
        dummyCollection.getGroup = jest.fn(() => dummyDefaultGroup as any);

        const response = await collectionPersistent.persistValue();

        expect(response).toBeTruthy();

        expect(dummyAgile.storages.set).toHaveBeenCalledWith(
          collectionPersistent._key,
          true,
          collectionPersistent.storageKeys
        );

        expect(dummyCollection.getGroup).toHaveBeenCalledWith(
          dummyCollection.config.defaultGroupKey
        );
        expect(dummyDefaultGroup.persist).toHaveBeenCalledWith({
          followCollectionPersistKeyPattern: true,
        });
        expect(dummyDefaultGroup.addSideEffect).toHaveBeenCalledWith(
          CollectionPersistent.defaultGroupSideEffectKey,
          expect.any(Function)
        );

        expect(dummyItem1.persist).toHaveBeenCalledWith(
          CollectionPersistent.getItemStorageKey(
            dummyItem1._key,
            collectionPersistent._key
          )
        );
        expect(dummyItem3.persist).toHaveBeenCalledWith(
          CollectionPersistent.getItemStorageKey(
            dummyItem3._key,
            collectionPersistent._key
          )
        );

        expect(collectionPersistent.isPersisted).toBeTruthy();
      });

      it("should persist defaultGroup and its Items with specific Key", async () => {
        collectionPersistent.ready = true;
        dummyCollection.getGroup = jest.fn(() => dummyDefaultGroup as any);

        const response = await collectionPersistent.persistValue("dummyKey");

        expect(response).toBeTruthy();

        expect(dummyAgile.storages.set).toHaveBeenCalledWith(
          "dummyKey",
          true,
          collectionPersistent.storageKeys
        );

        expect(dummyCollection.getGroup).toHaveBeenCalledWith(
          dummyCollection.config.defaultGroupKey
        );
        expect(dummyDefaultGroup.persist).toHaveBeenCalledWith({
          followCollectionPersistKeyPattern: true,
        });
        expect(dummyDefaultGroup.addSideEffect).toHaveBeenCalledWith(
          CollectionPersistent.defaultGroupSideEffectKey,
          expect.any(Function)
        );

        expect(dummyItem1.persist).toHaveBeenCalledWith(
          CollectionPersistent.getItemStorageKey(dummyItem1._key, "dummyKey")
        );
        expect(dummyItem3.persist).toHaveBeenCalledWith(
          CollectionPersistent.getItemStorageKey(dummyItem3._key, "dummyKey")
        );

        expect(collectionPersistent.isPersisted).toBeTruthy();
      });

      it("shouldn't persist defaultGroup and its Items if Persistent isn't ready", async () => {
        collectionPersistent.ready = false;
        dummyCollection.getGroup = jest.fn(() => dummyDefaultGroup as any);

        const response = await collectionPersistent.persistValue("dummyKey");

        expect(response).toBeFalsy();

        expect(dummyAgile.storages.set).not.toHaveBeenCalled();

        expect(dummyCollection.getGroup).not.toHaveBeenCalled();
        expect(dummyDefaultGroup.persist).not.toHaveBeenCalled();
        expect(dummyDefaultGroup.addSideEffect).not.toHaveBeenCalled();

        expect(dummyItem1.persist).not.toHaveBeenCalled();
        expect(dummyItem3.persist).not.toHaveBeenCalled();

        expect(collectionPersistent.isPersisted).toBeFalsy();
      });

      it("shouldn't persist defaultGroup and its Items if Collection has no defaultGroup", async () => {
        collectionPersistent.ready = true;
        dummyCollection.getGroup = jest.fn(() => undefined as any);

        const response = await collectionPersistent.persistValue();

        expect(response).toBeFalsy();

        expect(dummyAgile.storages.set).not.toHaveBeenCalled();

        expect(dummyCollection.getGroup).toHaveBeenCalledWith(
          dummyCollection.config.defaultGroupKey
        );
        expect(dummyDefaultGroup.persist).not.toHaveBeenCalled();
        expect(dummyDefaultGroup.addSideEffect).not.toHaveBeenCalled();

        expect(dummyItem1.persist).not.toHaveBeenCalled();
        expect(dummyItem3.persist).not.toHaveBeenCalled();

        expect(collectionPersistent.isPersisted).toBeFalsy();
      });

      describe("test added sideEffect called CollectionPersistent.defaultGroupSideEffectKey", () => {
        beforeEach(() => {
          collectionPersistent.rebuildStorageSideEffect = jest.fn();
        });

        it("should call rebuildStorageSideEffect", async () => {
          collectionPersistent.ready = true;
          dummyCollection.getGroup = jest.fn(() => dummyDefaultGroup as any);

          await collectionPersistent.persistValue();

          dummyDefaultGroup.sideEffects[
            CollectionPersistent.defaultGroupSideEffectKey
          ]({
            dummy: "property",
          });

          expect(
            collectionPersistent.rebuildStorageSideEffect
          ).toHaveBeenCalledWith(dummyDefaultGroup);
        });
      });
    });
  });
});
