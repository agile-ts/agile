import { StatusInterface } from './status';

export class StatusTracker {
  isTracking = false;
  trackedStatuses: Set<StatusInterface> = new Set();

  /**
   * Helper Class for automatic tracking set Statuses in validation methods.
   *
   * @internal
   */
  constructor() {
    // empty
  }

  /**
   * Activates the Status Tracker to globally track used Statuses.
   *
   * @internal
   */
  track(): void {
    this.isTracking = true;
  }

  /**
   * Tracks the specified Status and caches it
   * if the Status Tracker is actively tracking.
   *
   * @internal
   * @param status - Status
   */
  tracked(status: StatusInterface) {
    if (this.isTracking) this.trackedStatuses.add(status);
  }

  /**
   * Returns the latest tracked Statuses
   * and stops the Status Tracker from tracking any more Statuses.
   *
   * @internal
   */
  getTrackedStatuses(): Array<StatusInterface> {
    const trackedStatuses = Array.from(this.trackedStatuses);

    // Reset Status Tracker
    this.isTracking = false;
    this.trackedStatuses = new Set();

    return trackedStatuses;
  }
}
