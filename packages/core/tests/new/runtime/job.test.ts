import { Agile, Integration, RuntimeJob, Observer } from "../../../src";

describe("Job Tests", () => {
  let dummyAgile: Agile;
  let dummyIntegration: Integration;
  let dummyObserver: Observer;

  beforeEach(() => {
    dummyAgile = new Agile({ localStorage: false });
    dummyIntegration = new Integration({
      key: "myIntegration",
    });
    dummyObserver = new Observer(dummyAgile);
  });

  it("should create Job with Agile that has integrations (default config)", () => {
    dummyAgile.integrate(dummyIntegration);

    const job = new RuntimeJob(dummyObserver);

    expect(job._key).toBeUndefined();
    expect(job.observer).toBe(dummyObserver);
    expect(job.config).toStrictEqual({
      background: false,
      sideEffects: true,
      force: false,
      storage: true,
    });
    expect(job.rerender).toBeTruthy();
    expect(job.performed).toBeFalsy();
    expect(job.subscriptionContainersToUpdate.size).toBe(0);
  });

  it("should create Job with Agile that has integrations (specific config)", () => {
    dummyAgile.integrate(dummyIntegration);

    const job = new RuntimeJob(dummyObserver, {
      key: "dummyJob",
      sideEffects: false,
      force: true,
      storage: false,
    });

    expect(job._key).toBe("dummyJob");
    expect(job.observer).toBe(dummyObserver);
    expect(job.config).toStrictEqual({
      background: false,
      sideEffects: false,
      force: true,
      storage: false,
    });
    expect(job.rerender).toBeTruthy();
    expect(job.performed).toBeFalsy();
    expect(job.subscriptionContainersToUpdate.size).toBe(0);
  });

  it("should create Job with Agile that has no integrations (default config)", () => {
    const job = new RuntimeJob(dummyObserver);

    expect(job._key).toBeUndefined();
    expect(job.observer).toBe(dummyObserver);
    expect(job.config).toStrictEqual({
      background: false,
      sideEffects: true,
      force: false,
      storage: true,
    });
    expect(job.rerender).toBeFalsy();
    expect(job.performed).toBeFalsy();
    expect(job.subscriptionContainersToUpdate.size).toBe(0);
  });

  it("should create Job and Agile that has integrations (config.background = true)", () => {
    dummyAgile.integrate(dummyIntegration);

    const job = new RuntimeJob(dummyObserver, { background: true });

    expect(job._key).toBeUndefined();
    expect(job.observer).toBe(dummyObserver);
    expect(job.config).toStrictEqual({
      background: true,
      sideEffects: true,
      force: false,
      storage: true,
    });
    expect(job.rerender).toBeFalsy();
    expect(job.performed).toBeFalsy();
    expect(job.subscriptionContainersToUpdate.size).toBe(0);
  });

  describe("Job Function Tests", () => {
    let job: RuntimeJob;

    beforeEach(() => {
      job = new RuntimeJob(dummyObserver);
    });

    describe("key get function tests", () => {
      it("should return key of Job", () => {
        job._key = "myCoolKey";

        expect(job.key).toBe("myCoolKey");
      });
    });

    describe("key set function tests", () => {
      it("should update key in Job", () => {
        job.key = "myCoolKey";

        expect(job._key).toBe("myCoolKey");
      });
    });
  });
});
