import "mocha";
import { expect } from "chai";
import { Logger } from "../src/logger";

describe("Logger tests", () => {
  const logger = new Logger();

  it("Does Log", () => {
    logger.debug("this is a test");
    logger.debug("this is a test", ["ello"]);
    logger.warn("This is a Warning");
    logger.table("This is a Table", { test: "test" });
    logger.error("This is an Error");
    logger.trace("This is a Trace");
  });
});
