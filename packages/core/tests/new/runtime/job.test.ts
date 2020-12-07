import { Agile, Integration, Job, Observer } from "../../../src";

describe("Job Tests", () => {
  let dummyAgile: Agile;
  let dummyIntegration: Integration;
  let dummyObserver: Observer;

  beforeEach(() => {
    dummyAgile = new Agile();
    dummyIntegration = new Integration({
      key: "myIntegration",
    });
    dummyObserver = new Observer(dummyAgile);
  });

  it("should create Job with agile that has integrations (default config)", () => {
    dummyAgile.integrate(dummyIntegration);

    const job = new Job(dummyObserver);

    expect(job.observer).toBe(dummyObserver);
    expect(job.config).toStrictEqual({
      background: false,
      sideEffects: true,
      force: false,
      storage: true,
    });
    expect(job.rerender).toBeTruthy();
    expect(job.performed).toBeFalsy();
    expect(job._key).toBeUndefined();
  });

  it("should create Job with specific config and agile that has integrations", () => {
    dummyAgile.integrate(dummyIntegration);

    const job = new Job(dummyObserver, {
      key: "dummyJob",
      sideEffects: false,
      force: true,
      storage: false,
    });

    expect(job.observer).toBe(dummyObserver);
    expect(job.config).toStrictEqual({
      background: false,
      sideEffects: false,
      force: true,
      storage: false,
    });
    expect(job.rerender).toBeTruthy();
    expect(job.performed).toBeFalsy();
    expect(job._key).toBe("dummyJob");
  });

  it("should create Job with agile that has no integrations (default config)", () => {
    const job = new Job(dummyObserver);

    expect(job.rerender).toBeFalsy();
  });

  it("should create Job and agile that has integrations (config.background = true)", () => {
    dummyAgile.integrate(dummyIntegration);

    const job = new Job(dummyObserver, { background: true });

    expect(job.config).toStrictEqual({
      background: true,
      sideEffects: true,
      force: false,
      storage: true,
    });
    expect(job.rerender).toBeFalsy();
  });
});
