import { Observer } from "../runtime/observer";

export class ComputedTracker {
  static isTracking = false;
  static trackedObservers: Set<Observer> = new Set();

  //=========================================================================================================
  // Track
  //=========================================================================================================
  /**
   * @internal
   * Starts tracking Observers
   */
  static track(): void {
    this.isTracking = true;
  }

  //=========================================================================================================
  // Tracked
  //=========================================================================================================
  /**
   * @internal
   * Adds tracked Observer to trackedObservers
   */
  static tracked(observer: Observer) {
    if (this.isTracking) this.trackedObservers.add(observer);
  }

  //=========================================================================================================
  // Get Tracked Observers
  //=========================================================================================================
  /**
   * @internal
   * Returns tracked Observers and stops tracking anymore Observers
   */
  static getTrackedObservers(): Array<Observer> {
    const finalFoundObservers = Array.from(this.trackedObservers);

    // Reset tracking
    this.isTracking = false;
    this.trackedObservers = new Set();

    return finalFoundObservers;
  }
}
