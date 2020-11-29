import { Storage } from "../../../src";

describe("Storage Tests", () => {
  it("should create normal Storage with default Settings and normal Storage Methods", () => {
    const storage = new Storage({
      key: "customStorage",
      methods: {
        get: (key) => {},
        remove: (key) => {},
        set: (key, value) => {},
      },
    });
    expect(storage.key).toBe("customStorage");
    expect(storage.ready).toBe(true);
    expect(storage.config).toStrictEqual({
      async: false,
      prefix: "agile",
    });
    expect(storage).toHaveProperty("remove");
    expect(storage).toHaveProperty("get");
    expect(storage).toHaveProperty("set");
  });

  it("should create async Storage with config.async = true and config.prefix = 'test' Settings and normal Storage Methods", () => {
    const storage = new Storage({
      key: "customStorage",
      methods: {
        get: (key) => {},
        remove: (key) => {},
        set: (key, value) => {},
      },
      async: true,
      prefix: "test",
    });
    expect(storage.key).toBe("customStorage");
    expect(storage.ready).toBe(true);
    expect(storage.config).toStrictEqual({
      async: true,
      prefix: "test",
    });
    expect(storage).toHaveProperty("remove");
    expect(storage).toHaveProperty("get");
    expect(storage).toHaveProperty("set");
  });

  it("should create async Storage with default Settings and async Storage Methods", () => {
    const storage = new Storage({
      key: "customStorage",
      methods: {
        get: async (key) => {},
        remove: (key) => {},
        set: (key, value) => {},
      },
    });
    expect(storage.key).toBe("customStorage");
    expect(storage.ready).toBe(true);
    expect(storage.config).toStrictEqual({
      async: true,
      prefix: "agile",
    });
    expect(storage).toHaveProperty("remove");
    expect(storage).toHaveProperty("get");
    expect(storage).toHaveProperty("set");
  });

  describe("Normal Storage Tests", () => {
    let myStorage = {};
    let storage: Storage;

    beforeEach(() => {
      myStorage = {};
      storage = new Storage({
        key: "customStorage",
        methods: {
          get: (key) => myStorage[key],
          set: (key, value) => {
            myStorage[key] = value;
          },
          remove: (key) => {
            delete myStorage[key];
          },
        },
      });
    });

    describe("set function tests", () => {
      it("should add Value to Storage", () => {
        storage.set("myTestKey", "hello there");

        expect(myStorage).toHaveProperty("_agile_myTestKey");
        expect(myStorage["_agile_myTestKey"]).toBe(
          JSON.stringify("hello there")
        );
      });

      it("shouldn't add Value to Storage if Storage isn't ready", () => {
        storage.ready = false;
        storage.set("myTestKey", "hello there");

        expect(myStorage).toStrictEqual({});
      });
    });

    describe("get function tests", () => {
      beforeEach(() => {
        storage.set("myTestKey", "hello there");
      });

      it("should have correct initial Value", () => {
        expect(myStorage).toStrictEqual({
          ["_agile_myTestKey"]: JSON.stringify("hello there"),
        });
      });

      it("should get existing Value from Storage with 'get' method", () => {
        return storage.get("myTestKey").then((value) => {
          expect(value).toBe("hello there");
        });
      });

      it("should get existing Value from Storage with 'normalGet' method without any warnings", () => {
        const myStorageValue = storage.normalGet("myTestKey");

        expect(myStorageValue).toBe("hello there");
      });

      it("shouldn't get not existing Value from Storage", () => {
        const myStorageValue = storage.normalGet("myNotExistingKey");

        expect(myStorageValue).toBeUndefined();
      });

      it("shouldn't get existing Value from not ready Storage", () => {
        storage.ready = false;
        const myStorageValue = storage.normalGet("myTestKey");

        expect(myStorageValue).toBeUndefined();
      });
    });

    describe("remove function tests", () => {
      beforeEach(() => {
        storage.set("myTestKey", "hello there");
      });

      it("should have correct initial Value", () => {
        expect(myStorage).toStrictEqual({
          ["_agile_myTestKey"]: JSON.stringify("hello there"),
        });
      });

      it("should remove existing Value from Storage", () => {
        storage.remove("myTestKey");

        expect(myStorage).toStrictEqual({});
      });

      it("shouldn't remove not existing Value from Storage", () => {
        storage.remove("myNotExistingKey");

        expect(myStorage).toStrictEqual({
          ["_agile_myTestKey"]: JSON.stringify("hello there"),
        });
      });

      it("shouldn't remove existing Value from not ready Storage", () => {
        storage.ready = false;
        storage.remove("myNotExistingKey");

        expect(myStorage).toStrictEqual({
          ["_agile_myTestKey"]: JSON.stringify("hello there"),
        });
      });
    });
  });

  describe("Async Storage Tests", () => {
    let myStorage = {};
    let storage: Storage;

    beforeEach(() => {
      myStorage = {};
      storage = new Storage({
        key: "customStorage",
        methods: {
          get: async (key) => {
            await new Promise((res) => setTimeout(res, 1000));
            return myStorage[key];
          },
          set: (key, value) => {
            myStorage[key] = value;
          },
          remove: (key) => {
            delete myStorage[key];
          },
        },
      });
    });

    describe("get function tests", () => {
      beforeEach(() => {
        storage.set("myTestKey", "hello there");
      });

      it("should have correct initial Value", () => {
        expect(myStorage).toStrictEqual({
          ["_agile_myTestKey"]: JSON.stringify("hello there"),
        });
      });

      it("should get existing Value from Storage with 'get' method", () => {
        return storage.get("myTestKey").then((value) => {
          expect(value).toBe("hello there");
        });
      });

      it("should get existing Value stringified from Storage with 'normalGet' method and a warning", () => {
        console.warn = jest.fn();

        return storage.normalGet("myTestKey").then((value) => {
          expect(value).toBe(JSON.stringify("hello there"));
          expect(console.warn).toHaveBeenCalledWith(
            "Agile Warn: Be aware that 'normalGet' returns a Promise with a stringified Value if using it in an async Storage!"
          );
        });
      });

      it("shouldn't get not existing Value from Storage", () => {
        return storage.get("myNotExistingKey").then((value) => {
          expect(value).toBeUndefined();
        });
      });

      it("shouldn't get existing Value from not ready Storage", () => {
        storage.ready = false;
        return storage.get("myTestKey").then((value) => {
          expect(value).toBeUndefined();
        });
      });
    });
    // Only get tests because the set/remove function stayed the same
  });
});
