import { Observer } from '../runtime';

export class ComputedTracker {
  static isTracking = false;
  static trackedObservers: Set<Observer> = new Set();

  /**
   * Helper Class for automatic tracking used Observers (dependencies) in a compute function.
   *
   * @internal
   */
  constructor() {
    // empty
  }

  /**
   * Activates the Computed Tracker to globally track used Observers.
   *
   * @internal
   */
  static track(): void {
    this.isTracking = true;
  }

  /**
   * Tracks the specified Observer and caches it
   * if the Computed Tracker is actively tracking.
   *
   * @internal
   * @param observer - Observer
   */
  static tracked(observer: Observer) {
    if (this.isTracking) this.trackedObservers.add(observer);
  }

  /**
   * Returns the latest tracked Observers
   * and stops the Computed Tracker from tracking any more Observers.
   *
   * @internal
   */
  static getTrackedObservers(): Array<Observer> {
    const trackedObservers = Array.from(this.trackedObservers);

    // Reset Computed Tracker
    this.isTracking = false;
    this.trackedObservers = new Set();

    return trackedObservers;
  }
}
