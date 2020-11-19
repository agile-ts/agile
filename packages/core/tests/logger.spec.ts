import "mocha";
import { expect } from "chai";
import { Logger } from "../src";

describe("Logger tests", () => {
  const logger = new Logger();

  it("Does Log", () => {
    logger.trace("This is a Trace");
    logger.debug("this is a test");
    logger.debug("this is a test", ["ello"]);
    logger.info("this is a Test", {}, {});
    logger.warn("This is a Warning");
    logger.table("This is a Table", { test: "test" });
    logger.error("This is an Error");
    logger.if.tag(["test"]).log("faranke");
  });
});
