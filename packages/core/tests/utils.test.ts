import { copy } from "../src";

describe("Utils", () => {
  describe("Copy", () => {
    it("should copy Array without any reference", () => {
      const myArray = [1, 2, 3, 4, 5];
      const myCopiedArray = copy(myArray);

      expect(myCopiedArray).toBe([1, 2, 3, 4, 5]);

      myCopiedArray.push(6);

      expect(myCopiedArray).toBe([1, 2, 3, 4, 5, 6]);
      expect(myArray).toBe([1, 2, 3, 4, 5]);
    });
  });
});
