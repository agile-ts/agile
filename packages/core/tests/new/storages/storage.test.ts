import { Storage } from "../../../src";

describe("Storage Tests", () => {
  let dummyStorageMethods;

  beforeEach(() => {
    jest.clearAllMocks();

    dummyStorageMethods = {
      get: jest.fn(),
      remove: jest.fn(),
      set: jest.fn(),
    };

    // https://codewithhugo.com/jest-stub-mock-spy-set-clear/
    jest.spyOn(Storage.prototype, "validate");
    console.warn = jest.fn();
    console.error = jest.fn();
  });

  it("should create not async Storage with normal Storage Methods (default config)", () => {
    jest.spyOn(Storage.prototype, "validate").mockReturnValueOnce(true);

    const storage = new Storage({
      key: "customStorage",
      methods: dummyStorageMethods,
    });

    expect(storage.key).toBe("customStorage");
    expect(storage.validate).toHaveBeenCalled();
    expect(storage.ready).toBe(true);
    expect(storage.config).toStrictEqual({
      async: false,
      prefix: "agile",
    });
    expect(storage.methods).toStrictEqual(dummyStorageMethods);
  });

  it("should create not async Storage with normal Storage Methods (specific config)", () => {
    jest.spyOn(Storage.prototype, "validate").mockReturnValueOnce(true);

    const storage = new Storage({
      key: "customStorage",
      methods: dummyStorageMethods,
      prefix: "testPrefix",
    });

    expect(storage.key).toBe("customStorage");
    expect(storage.validate).toHaveBeenCalled();
    expect(storage.ready).toBe(true);
    expect(storage.config).toStrictEqual({
      async: false,
      prefix: "testPrefix",
    });
    expect(storage.methods).toStrictEqual(dummyStorageMethods);
  });

  it("should create async Storage with normal Storage Methods (config.async = true)", () => {
    jest.spyOn(Storage.prototype, "validate").mockReturnValueOnce(true);
    const storage = new Storage({
      key: "customStorage",
      methods: dummyStorageMethods,
      async: true,
    });

    expect(storage.key).toBe("customStorage");
    expect(storage.validate).toHaveBeenCalled();
    expect(storage.ready).toBe(true);
    expect(storage.config).toStrictEqual({
      async: true,
      prefix: "agile",
    });
    expect(storage.methods).toStrictEqual(dummyStorageMethods);
  });

  it("should create async Storage with async Storage Methods (default config)", () => {
    jest.spyOn(Storage.prototype, "validate").mockReturnValueOnce(true);
    dummyStorageMethods.get = async () => jest.fn();

    const storage = new Storage({
      key: "customStorage",
      methods: dummyStorageMethods,
    });

    expect(storage.key).toBe("customStorage");
    expect(storage.validate).toHaveBeenCalled();
    expect(storage.ready).toBe(true);
    expect(storage.config).toStrictEqual({
      async: true,
      prefix: "agile",
    });
    expect(storage.methods).toStrictEqual(dummyStorageMethods);
  });

  it("should create invalid Storage with normal Storage Methods if validate returns false (default config)", () => {
    jest.spyOn(Storage.prototype, "validate").mockReturnValueOnce(false);

    const storage = new Storage({
      key: "customStorage",
      methods: dummyStorageMethods,
    });

    expect(storage.key).toBe("customStorage");
    expect(storage.validate).toHaveBeenCalled();
    expect(storage.ready).toBe(false);
    expect(storage.config).toStrictEqual({
      async: false,
      prefix: "agile",
    });
    expect(storage.methods).toStrictEqual(dummyStorageMethods);
  });

  describe("Storage Function Tests", () => {
    let storage: Storage;

    beforeEach(() => {
      storage = new Storage({
        key: "customStorage",
        methods: dummyStorageMethods,
      });
    });

    describe("validate function tests", () => {
      it("should return true if all methods are valid", () => {
        const response = storage.validate();

        expect(response).toBeTruthy();
        expect(console.error).not.toHaveBeenCalled();
      });

      it("should return false if get method isn't valid", () => {
        storage.methods.get = undefined;

        const response = storage.validate();

        expect(response).toBeFalsy();
        expect(console.error).toHaveBeenCalledWith(
          "Agile Error: Your GET StorageMethod isn't valid!"
        );
      });

      it("should return false if set method isn't valid", () => {
        storage.methods.set = undefined;

        const response = storage.validate();

        expect(response).toBeFalsy();
        expect(console.error).toHaveBeenCalledWith(
          "Agile Error: Your SET StorageMethod isn't valid!"
        );
      });

      it("should return false if remove method isn't valid", () => {
        storage.methods.remove = undefined;

        const response = storage.validate();

        expect(response).toBeFalsy();
        expect(console.error).toHaveBeenCalledWith(
          "Agile Error: Your REMOVE StorageMethod isn't valid!"
        );
      });
    });

    describe("normalGet function tests", () => {
      it("should call get method in storageMethods if Storage is ready", () => {
        storage.ready = true;
        storage.methods.get = jest.fn(() => "dummyResponse");

        const response = storage.normalGet("myTestKey");

        expect(response).toBe("dummyResponse");
        expect(storage.methods.get).toHaveBeenCalledWith(
          storage.getStorageKey("myTestKey")
        );
      });

      it("should call get method in storageMethods and resolve json if Storage is ready", () => {
        storage.ready = true;
        storage.methods.get = jest.fn(() => [
          {
            dummy: "json",
          },
        ]);

        const response = storage.normalGet("myTestKey");

        expect(response).toStrictEqual([{ dummy: "json" }]);
        expect(storage.methods.get).toHaveBeenCalledWith(
          storage.getStorageKey("myTestKey")
        );
      });

      it("shouldn't call get method in storageMethods if Storage isn't ready", () => {
        storage.ready = false;

        const response = storage.normalGet("myTestKey");

        expect(response).toBeUndefined();
        expect(storage.methods.get).not.toHaveBeenCalled();
      });

      it("should call get method in storageMethods and print warning if get method is async", async () => {
        storage.ready = true;
        storage.methods.get = async () => {
          await new Promise((resolve) => setTimeout(resolve, 100));
          return "dummyResponse";
        };

        const response = storage.normalGet("myTestKey");
        expect(response).toBeInstanceOf(Promise);
        // Couldn't figure out how to create an async mock function
        // expect(storage.methods.get).toHaveBeenCalledWith(
        //  storage.getStorageKey("myTestKey")
        // );
        expect(console.warn).toHaveBeenCalledWith(
          "Agile Warn: Be aware that 'normalGet' returns a Promise with a stringified Value if using it in an async Storage!"
        );

        return response.then((value) => {
          expect(value).toBe("dummyResponse");
        });
      });
    });

    describe("get function tests", () => {
      it("should call and await get method in storageMethods if Storage is ready", async () => {
        storage.ready = true;
        storage.methods.get = async () => {
          await new Promise((resolve) => setTimeout(resolve, 100));
          return "dummyResponse";
        };

        const response = await storage.get("myTestKey");

        expect(response).toBe("dummyResponse");
        // Couldn't figure out how to create an async mock function
        // expect(storage.methods.get).toHaveBeenCalledWith(
        //  storage.getStorageKey("myTestKey")
        // );
      });

      it("should call and await get method in storageMethods and resolve json if Storage is ready", async () => {
        storage.ready = true;
        storage.methods.get = async () => {
          await new Promise((resolve) => setTimeout(resolve, 100));
          return [
            {
              dummy: "json",
            },
          ];
        };

        const response = await storage.get("myTestKey");

        expect(response).toStrictEqual([{ dummy: "json" }]);
        // Couldn't figure out how to create an async mock function
        // expect(storage.methods.get).toHaveBeenCalledWith(
        //  storage.getStorageKey("myTestKey")
        // );
      });

      it("shouldn't call get method in storageMethods if Storage isn't ready", async () => {
        storage.ready = false;

        const response = await storage.get("myTestKey");

        expect(response).toBeUndefined();
        expect(storage.methods.get).not.toHaveBeenCalled();
      });

      it("should call normalGet if get method isn't async", async () => {
        storage.ready = true;
        storage.normalGet = jest.fn(() => "dummyResponse" as any);

        const response = await storage.get("myTestKey");

        expect(response).toBe("dummyResponse");
        expect(storage.normalGet).toHaveBeenCalledWith("myTestKey");
      });
    });

    describe("set function tests", () => {
      it("should call set method in storageMethods if Storage is ready", () => {
        storage.ready = true;

        storage.set("myTestKey", "hello there");

        expect(storage.methods.set).toHaveBeenCalledWith(
          storage.getStorageKey("myTestKey"),
          JSON.stringify("hello there")
        );
      });

      it("shouldn't call set method in storageMethods if Storage isn't ready", () => {
        storage.ready = false;

        storage.set("myTestKey", "hello there");

        expect(storage.methods.set).not.toHaveBeenCalled();
      });
    });

    describe("remove function tests", () => {
      it("should call remove method in storageMethods if Storage is ready", () => {
        storage.ready = true;

        storage.remove("myTestKey");

        expect(storage.methods.remove).toHaveBeenCalledWith(
          storage.getStorageKey("myTestKey")
        );
      });

      it("shouldn't call remove method in storageMethods if Storage isn't ready", () => {
        storage.ready = false;

        storage.remove("myTestKey");

        expect(storage.methods.remove).not.toHaveBeenCalled();
      });
    });

    describe("getStorageKey function tests", () => {
      it("should add prefix to passed key if prefix is set", () => {
        storage.config.prefix = "test";

        expect(storage.getStorageKey("coolKey")).toBe("_test_coolKey");
      });

      it("shouldn't add prefix to passed key if prefix isn't set", () => {
        storage.config.prefix = undefined;

        expect(storage.getStorageKey("coolKey")).toBe("coolKey");
      });
    });
  });
});
