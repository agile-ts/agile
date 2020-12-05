import { Agile, Job, Observer, Runtime } from "../../../src";

describe("Runtime Tests", () => {
  let dummyAgile: Agile;

  beforeEach(() => {
    dummyAgile = new Agile({ localStorage: false });
  });

  it("should create Runtime", () => {
    const runtime = new Runtime(dummyAgile);

    expect(runtime.currentJob).toBeNull();
    expect(runtime.jobQueue).toStrictEqual([]);
    expect(runtime.notReadyJobsToRerender).toStrictEqual([]);
    expect(runtime.jobsToRerender).toStrictEqual([]);
    expect(runtime.trackObservers).toBeFalsy();
    expect(runtime.foundObservers.size).toBe(0);
  });

  describe("Default Runtime Tests", () => {
    let runtime: Runtime;
    let dummyObserver1: Observer;
    let dummyObserver2: Observer;
    let dummyJob: Job;

    beforeEach(() => {
      runtime = new Runtime(dummyAgile);
      dummyObserver1 = new Observer(dummyAgile, { key: "dummyObserver1" });
      dummyObserver2 = new Observer(dummyAgile, { key: "dummyObserver2" });
      dummyJob = new Job(dummyObserver1);
    });

    describe("ingest function tests", () => {
      beforeEach(() => {
        runtime.perform = jest.fn();
        runtime.jobQueue.shift = jest.fn(() => dummyJob);
      });

      it("should create Job and perform it with default Config", () => {
        runtime.ingest(dummyObserver1, { key: "coolJob" });

        expect(runtime.jobQueue.length).toBe(1);
        expect(runtime.jobQueue[0].key).toBe("coolJob");
        expect(runtime.jobQueue.shift).toHaveBeenCalled();
        expect(runtime.perform).toHaveBeenCalledWith(dummyJob); // Dummy Job because of mocking jobQueue.shift
      });

      it("should create Job and not perform it with config.perform = false", () => {
        runtime.ingest(dummyObserver1, { perform: false, key: "coolJob" });

        expect(runtime.jobQueue.length).toBe(1);
        expect(runtime.jobQueue[0].key).toBe("coolJob");
        expect(runtime.jobQueue.shift).not.toHaveBeenCalled();
        expect(runtime.perform).not.toHaveBeenCalled();
      });
    });

    describe("perform function tests", () => {
      let dummyJob1: Job;
      let dummyJob2: Job;
      let dummyJob3: Job;

      beforeEach(() => {
        dummyJob1 = new Job(dummyObserver1, { key: "dummyJob1" });
        dummyJob2 = new Job(dummyObserver2, { key: "dummyJob2" });
        dummyJob3 = new Job(dummyObserver1, { key: "dummyJob3" });
        dummyJob1.rerender = true;
        dummyJob2.rerender = true;
        dummyJob3.rerender = false;
        runtime.updateSubscribers = jest.fn();
        jest.spyOn(dummyObserver1, "perform");
        jest.spyOn(dummyObserver2, "perform");
      });

      it("should perform passed Job and all that are left in jobsQueue and it should call updateSubscribers", () => {
        runtime.jobQueue.push(dummyJob2);
        runtime.jobQueue.push(dummyJob3);
        runtime.perform(dummyJob1);

        expect(dummyObserver1.perform).toHaveBeenCalledWith(dummyJob1);
        expect(dummyJob1.performed).toBeTruthy();
        expect(dummyObserver2.perform).toHaveBeenCalledWith(dummyJob2);
        expect(dummyJob2.performed).toBeTruthy();
        expect(dummyObserver1.perform).toHaveBeenCalledWith(dummyJob3);
        expect(dummyJob3.performed).toBeTruthy();

        expect(runtime.jobQueue.length).toBe(0);
        expect(runtime.jobsToRerender.length).toBe(2);
        expect(runtime.jobsToRerender.indexOf(dummyJob1)).not.toBe(-1);
        expect(runtime.jobsToRerender.indexOf(dummyJob2)).not.toBe(-1);
        expect(runtime.jobsToRerender.indexOf(dummyJob3)).toBe(-1);

        // Sleep 5ms because updateSubscribers get called in timeout
        return new Promise((resolve) => setTimeout(resolve, 5)).then(() => {
          expect(runtime.updateSubscribers).toHaveBeenCalled();
        });
      });

      it("should perform passed Job and shouldn't call updateSubscribes", () => {
        dummyJob1.rerender = false;
        runtime.perform(dummyJob1);

        expect(dummyObserver1.perform).toHaveBeenCalledWith(dummyJob1);
        expect(dummyJob1.performed).toBeTruthy();

        expect(runtime.jobQueue.length).toBe(0);
        expect(runtime.jobsToRerender.length).toBe(0);

        // Sleep 5ms because updateSubscribers get called in timeout
        return new Promise((resolve) => setTimeout(resolve, 5)).then(() => {
          expect(runtime.updateSubscribers).not.toHaveBeenCalled();
        });
      });
    });

    describe("updateSubscribers function tests", () => {});
  });
});
