import { Observer } from '../runtime/observer';

export class ComputedTracker {
  static isTracking = false;
  static trackedObservers: Set<Observer> = new Set();

  /**
   * @internal
   * Activates Computed Tracker to globally track used Observers.
   */
  static track(): void {
    this.isTracking = true;
  }

  /**
   * @internal
   * Tracks the passed Observer and caches it
   * when the Computed Tracker is actively tracking.
   * @param observer - Observer
   */
  static tracked(observer: Observer) {
    if (this.isTracking) this.trackedObservers.add(observer);
  }

  /**
   * @internal
   * Returns the last tracked Observers
   * and stops the Computed Tracker from tracking any more Observers.
   */
  static getTrackedObservers(): Array<Observer> {
    const trackedObservers = Array.from(this.trackedObservers);

    // Reset Computed Tracker
    this.isTracking = false;
    this.trackedObservers = new Set();

    return trackedObservers;
  }
}
