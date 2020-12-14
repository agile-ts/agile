import { EventJob } from "../../../src";

describe("EventJob Tests", () => {
  it("should create EventJob", () => {
    const eventJob = new EventJob("myPayload");

    expect(eventJob.payload).toBe("myPayload");
    expect(eventJob.creationTimestamp).toBeCloseTo(new Date().getTime(), -1);
  });
});
