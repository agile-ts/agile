import { Agile, Integration, Job, Observer } from "../../../src";

describe("Job Tests", () => {
  let agile: Agile;
  let integration: Integration;
  let observer: Observer;

  beforeEach(() => {
    agile = new Agile();
    integration = new Integration({
      key: "myIntegration",
    });
    observer = new Observer(agile);
  });

  it("should instantiate Job with default config and agile that has integrations", () => {
    agile.integrate(integration);
    const job = new Job(observer);

    expect(job.observer).toBe(observer);
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

  it("should instantiate Job with default config and agile that has integrations", () => {
    const job = new Job(observer);

    expect(job.observer).toBe(observer);
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

  it("should instantiate Job with config.background = false and agile that has integrations", () => {
    agile.integrate(integration);
    const job = new Job(observer, { background: true });

    expect(job.observer).toBe(observer);
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
