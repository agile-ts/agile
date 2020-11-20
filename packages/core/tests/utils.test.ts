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
  });
});
