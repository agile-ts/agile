import { ComputedTracker, Observer, Agile } from '../../../src';
import { LogMock } from '../../helper/logMock';

describe('ComputedTracker Tests', () => {
  let dummyAgile: Agile;

  beforeEach(() => {
    LogMock.mockLogs();

    dummyAgile = new Agile();

    // Reset ComputedTracker (because it works static)
    ComputedTracker.isTracking = false;
    ComputedTracker.trackedObservers = new Set();

    jest.clearAllMocks();
  });

  describe('ComputedTracker Function Tests', () => {
    describe('track function tests', () => {
      it('should set isTracking to true', () => {
        ComputedTracker.isTracking = false;

        ComputedTracker.track();

        expect(ComputedTracker.isTracking).toBeTruthy();
      });
    });

    describe('tracked function tests', () => {
      let dummyObserver: Observer;

      beforeEach(() => {
        dummyObserver = new Observer(dummyAgile);
      });

      it('should add passed Observer to trackedObservers if ComputedTracker is tracking', () => {
        ComputedTracker.isTracking = true;

        ComputedTracker.tracked(dummyObserver);

        expect(ComputedTracker.trackedObservers.size).toBe(1);
        expect(
          ComputedTracker.trackedObservers.has(dummyObserver)
        ).toBeTruthy();
      });

      it("shouldn't add passed Observer to trackedObservers if ComputedTracker isn't tracking", () => {
        ComputedTracker.isTracking = false;

        ComputedTracker.tracked(dummyObserver);

        expect(ComputedTracker.trackedObservers.size).toBe(0);
      });
    });

    describe('getTrackedObserver function tests', () => {
      let dummyObserver1: Observer;
      let dummyObserver2: Observer;

      beforeEach(() => {
        dummyObserver1 = new Observer(dummyAgile);
        dummyObserver2 = new Observer(dummyAgile);

        ComputedTracker.isTracking = true;
        ComputedTracker.trackedObservers.add(dummyObserver1);
        ComputedTracker.trackedObservers.add(dummyObserver2);
      });

      it('should return tracked Observers and reset tracking', () => {
        const response = ComputedTracker.getTrackedObservers();

        expect(response).toStrictEqual([dummyObserver1, dummyObserver2]);
        expect(ComputedTracker.isTracking).toBeFalsy();
        expect(ComputedTracker.trackedObservers.size).toBe(0);
      });
    });
  });
});
