import { copy } from "../src";

describe("Utils", () => {
  describe("Copy", () => {
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

  describe("isValidObject", () => {});
});
