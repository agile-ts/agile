import {
  copy,
  defineConfig,
  equal,
  flatMerge,
  includesArray,
  isFunction,
  isJsonString,
  isValidObject,
  isValidUrl,
  normalizeArray,
} from "../src";

describe("Utils", () => {
  describe("copy", () => {
    it("should copy Array without any reference", () => {
      const myArray = [1, 2, 3, 4, 5];
      const myCopiedArray = copy(myArray);

      expect(myCopiedArray).toStrictEqual([1, 2, 3, 4, 5]);

      myCopiedArray.push(6);

      expect(myCopiedArray).toStrictEqual([1, 2, 3, 4, 5, 6]);
      expect(myArray).toStrictEqual([1, 2, 3, 4, 5]);
    });

    it("should copy Object without any reference", () => {
      const myObject = { id: 1, name: "jeff" };
      const myCopiedObject = copy(myObject);

      expect(myCopiedObject).toStrictEqual({ id: 1, name: "jeff" });

      myCopiedObject.name = "hans";

      expect(myCopiedObject).toStrictEqual({ id: 1, name: "hans" });
      expect(myObject).toStrictEqual({ id: 1, name: "jeff" });
    });

    it("should copy default Types", () => {
      const myNumber = 5;
      const myCopiedNumber = copy(myNumber);
      const myString = "frank";
      const myCopiedString = copy(myString);

      expect(myCopiedNumber).toBe(5);
      expect(myCopiedString).toBe("frank");
    });
  });

  describe("isValidObject", () => {
    it("should return false if passing Array", () => {
      expect(isValidObject([1, 2])).toBe(false);
    });

    it("should return false if passing default Types", () => {
      expect(isValidObject("Hello")).toBe(false);
      expect(isValidObject(123)).toBe(false);
    });

    /* Can't be Tested in not Web-Environment
            it("should return false if passing HTML Element", () => {
              expect(isValidObject(HTMLElement)).toBe(false);
            });
             */

    it("should return false if passing null", () => {
      expect(isValidObject(null)).toBe(false);
    });

    it("should return true if passing object", () => {
      expect(isValidObject({ hello: "jeff" })).toBe(true);
    });
  });

  describe("includesArray", () => {
    it("should return false if Array1 doesn't include Array2", () => {
      expect(includesArray([1, 2], [5, 6])).toBe(false);
    });

    it("should return false if Array1 does only include parts of Array2", () => {
      expect(includesArray([1, 2], [2, 6])).toBe(false);
    });

    it("should return true if Array1 includes Array2", () => {
      expect(includesArray([1, 4, 2, 3], [1, 2])).toBe(true);
    });

    it("should return true if Array1 is equal to Array2", () => {
      expect(includesArray([1, 2], [1, 2])).toBe(true);
    });
  });

  describe("normalizeArray", () => {
    it("should normalize Array", () => {
      expect(normalizeArray([1, 2, undefined, 3, "hi"])).toStrictEqual([
        1,
        2,
        undefined,
        3,
        "hi",
      ]);
    });

    it("should normalize Item", () => {
      expect(normalizeArray(1)).toStrictEqual([1]);
    });

    it("shouldn't normalize undefined", () => {
      expect(normalizeArray(undefined)).toStrictEqual([]);
    });

    it("should normalize undefined with config.createUndefinedArray = true", () => {
      expect(
        normalizeArray(undefined, { createUndefinedArray: true })
      ).toStrictEqual([undefined]);
    });
  });

  describe("isFunction", () => {
    it("should return true if passing aFunction", () => {
      expect(isFunction(() => {})).toBe(true);
    });

    it("should return false if not passing a Function", () => {
      expect(isFunction("hello")).toBe(false);
      expect(isFunction(1)).toBe(false);
      expect(isFunction([1, 2, 3])).toBe(false);
      expect(isFunction({ hello: "jeff" })).toBe(false);
    });
  });

  describe("isValidUrl", () => {
    it("should return true if passing valid Url", () => {
      expect(isValidUrl("https://www.google.com/")).toBe(true);
      expect(isValidUrl("www.google.com")).toBe(true);
      // expect(isValidUrl("https://en.wikipedia.org/wiki/Procter_&_Gamble")).toBe(
      //   true
      // );
    });

    it("should return false if not passing valid Url", () => {
      expect(isValidUrl("hello")).toBe(false);
      expect(isValidUrl("https://sdfasd")).toBe(false);
      expect(isValidUrl("https://")).toBe(false);
    });
  });

  describe("isJsonString", () => {
    it("should return true if passing valid Json String", () => {
      expect(isJsonString('{"name":"John", "age":31, "city":"New York"}')).toBe(
        true
      );
    });

    it("should return false if passing not valid Json String", () => {
      expect(isJsonString("frank")).toBe(false);
      expect(isJsonString('{name":"John", "age":31, "city":"New York"}')).toBe(
        false
      );
    });
  });

  describe("defineConfig", () => {
    it("should merge defaults into config", () => {
      const config = {
        allowLogging: true,
        loops: 10,
        isHuman: undefined,
      };
      expect(
        defineConfig(config, {
          allowLogging: false,
          loops: 15,
          isHuman: true,
          isRobot: false,
          name: "jeff",
        })
      ).toStrictEqual({
        allowLogging: true,
        loops: 10,
        isHuman: undefined,
        isRobot: false,
        name: "jeff",
      });
    });
  });

  describe("flatMerge", () => {
    it("should merge changes into source", () => {
      const source = {
        id: 123,
        name: "jeff",
        size: 189,
      };
      expect(
        flatMerge(source, {
          name: "hans",
          size: 177,
        })
      ).toStrictEqual({
        id: 123,
        name: "hans",
        size: 177,
      });
    });

    it("shouldn't add new properties to source", () => {
      const source = {
        id: 123,
        name: "jeff",
        size: 189,
      };
      expect(
        flatMerge(source, {
          name: "hans",
          size: 177,
          location: "behind you",
        })
      ).toStrictEqual({
        id: 123,
        name: "hans",
        size: 177,
      });
    });

    it("should add new properties to source with config.addNewProperties = true", () => {
      const source = {
        id: 123,
        name: "jeff",
        size: 189,
      };
      expect(
        flatMerge(
          source,
          {
            name: "hans",
            size: 177,
            location: "behind you",
          },
          { addNewProperties: true }
        )
      ).toStrictEqual({
        id: 123,
        name: "hans",
        size: 177,
        location: "behind you",
      });
    });

    it("can't deep merge changes", () => {
      const source = {
        id: 123,
        name: "jeff",
        address: {
          place: "JeffsHome",
          country: "Germany",
        },
      };

      expect(
        flatMerge(source, {
          place: "JeffsNewHome",
        })
      ).toStrictEqual({
        id: 123,
        name: "jeff",
        address: {
          place: "JeffsHome",
          country: "Germany",
        },
      });
    });
  });

  describe("equal", () => {
    it("should return true if value1 and value2 are equal", () => {
      expect(equal({ id: 123, name: "jeff" }, { id: 123, name: "jeff" })).toBe(
        true
      );
      expect(equal([1, 2, 3], [1, 2, 3])).toBe(true);
      expect(equal(12, 12)).toBe(true);
    });

    it("should return false if value1 and value2 are not equal", () => {});
  });
});
