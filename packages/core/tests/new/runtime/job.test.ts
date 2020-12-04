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

  it("should instantiate Job with default config and agile that has integrations", () => {
    dummyAgile.integrate(dummyIntegration);

    const job = new Job(dummyObserver);

    expect(job.observer).toBe(dummyObserver);
    expect(job.config).toStrictEqual({
      background: false,
      sideEffects: true,
      force: false,
      storage: true,
      perform: true,
    });
    expect(job.rerender).toBeTruthy();
    expect(job.performed).toBeFalsy();
  });

  it("should instantiate Job with default config and agile that has no integrations", () => {
    const job = new Job(dummyObserver);

    expect(job.observer).toBe(dummyObserver);
    expect(job.config).toStrictEqual({
      background: false,
      sideEffects: true,
      force: false,
      storage: true,
      perform: true,
    });
    expect(job.rerender).toBeFalsy();
    expect(job.performed).toBeFalsy();
  });

  it("should instantiate Job with config.background = true and agile that has integrations", () => {
    dummyAgile.integrate(dummyIntegration);

    const job = new Job(dummyObserver, { background: true });

    expect(job.observer).toBe(dummyObserver);
    expect(job.config).toStrictEqual({
      background: true,
      sideEffects: true,
      force: false,
      storage: true,
      perform: true,
    });
    expect(job.rerender).toBeFalsy();
    expect(job.performed).toBeFalsy();
  });
});
