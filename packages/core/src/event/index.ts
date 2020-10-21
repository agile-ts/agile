import { Agile, defineConfig, generateId } from "../internal";
import { EventObserver } from "./event.observer";

export class Event<PayloadType = DefaultEventPayload> {
  public agileInstance: () => Agile;

  public config: EventConfig;

  public _key?: EventKey;
  public uses: number = 0;
  public callbacks: { [key: string]: EventCallbackFunction<PayloadType> } = {}; // All 'subscribed' callback function
  private currentTimeout: any; // Timeout which is active right now
  private queue: Array<PayloadType> = []; // Queue of delayed triggers
  public enabled: boolean = true;
  public observer: EventObserver;

  // @ts-ignore
  public payload: PayloadType; // Holds type of Payload so that it can be read external (never defined)

  /**
   * @public
   * Event - Handy function for emitting UI updates and passing data with them
   * @param {Agile} agileInstance - An instance of Agile
   * @param {EventConfig} config - Config
   */
  constructor(agileInstance: Agile, config: EventConfig = {}) {
    this.agileInstance = () => agileInstance;
    this.config = defineConfig<EventConfig>(config, {
      enabled: true,
      rerender: false,
    });
    this.observer = new EventObserver(agileInstance, this, [], this.config.key);
    this._key = this.config.key;
    this.enabled =
      this.config.enabled !== undefined ? this.config.enabled : true;
  }

  public set key(value: EventKey | undefined) {
    this._key = value;
    this.observer.key = value;
  }

  public get key(): EventKey | undefined {
    return this._key;
  }

  //=========================================================================================================
  // On
  //=========================================================================================================
  /**
   * @public
   * Register new Callback Function which will be called if the Event got triggered
   * @param callback - CallbackFunction of the Event
   * @param {string} key - Key/Name of the Callback Function
   * @return Clean up function which removes the callback
   */
  public on(
    callback: EventCallbackFunction<PayloadType>,
    key?: string
  ): () => void {
    const _key = key || generateId();

    // Check if Callback already exist
    if (this.callbacks.hasOwnProperty(_key)) {
      console.warn(
        `Agile: CallbackFunction with the name/key ${_key} already exists!`
      );
      return () => this.unsubscribeCallback(_key);
    }

    this.callbacks[_key] = callback;

    return () => this.unsubscribeCallback(_key);
  }

  //=========================================================================================================
  // Trigger
  //=========================================================================================================
  /**
   * @public
   * Trigger Event - Calls all registered Callback Functions
   * @param payload - Payload which will be passed into the Callback Function
   */
  public trigger(payload?: PayloadType) {
    if (!this.enabled) return this;
    if (this.config.delay) this.delayedTrigger(payload);
    else this.normalTrigger(payload);
    return this;
  }

  //=========================================================================================================
  // Disable
  //=========================================================================================================
  /**
   * @public
   * Disable Event -> It can't be triggered and doesn't call the callback functions
   */
  public disable() {
    this.enabled = false;
    return this;
  }

  //=========================================================================================================
  // Enable
  //=========================================================================================================
  /**
   * @public
   * Enable Event -> It can be triggered and calls the callback functions
   */
  public enable() {
    this.enabled = true;
    return this;
  }

  //=========================================================================================================
  // Reset
  //=========================================================================================================
  /**
   * @public
   * Reset Event
   */
  public reset() {
    this.enabled = this.config.enabled || true;
    this.uses = 0;
    if (this.currentTimeout) clearTimeout(this.currentTimeout);
    return this;
  }

  //=========================================================================================================
  // Unsubscribe Callback
  //=========================================================================================================
  /**
   * @public
   * Unsubscribes Event Callback Function at key
   * @param {string} key - Key/Name of the Callback Function which should get removed
   */
  private unsubscribeCallback(key: string): this {
    // Check if Callback exists
    if (!this.callbacks.hasOwnProperty(key)) {
      console.warn(
        `Agile: CallbackFunction with the name/key ${key} doesn't exist!`
      );
      return this;
    }

    delete this.callbacks[key];

    return this;
  }

  //=========================================================================================================
  // Normal Trigger
  //=========================================================================================================
  /**
   * @internal
   * Call event instantly
   */
  private normalTrigger(payload?: PayloadType) {
    // Call registered Callbacks
    for (let key in this.callbacks) this.callbacks[key](payload);

    // Cause rerender
    if (this.config.rerender) this.observer.trigger();

    this.uses++;

    // Disable Event if maxUses got reached
    if (this.config.maxUses && this.uses >= this.config.maxUses) this.disable();
  }

  //=========================================================================================================
  // Delayed Trigger
  //=========================================================================================================
  /**
   * @internal
   * Call event after config.delay
   */
  private delayedTrigger(payload?: PayloadType) {
    // Check if a timeout is currently active if so add payload to queue
    if (this.currentTimeout !== undefined) {
      if (payload) this.queue.push(payload);
      return;
    }

    // Triggers callbacks in timeout and calls its self again if queue isn't empty
    const looper = (payload?: PayloadType) => {
      this.currentTimeout = setTimeout(() => {
        // Reset currentTimeout
        this.currentTimeout = undefined;

        // Call normalTrigger
        this.normalTrigger(payload);

        // If items are in queue, continue with them
        if (this.queue.length > 0) looper(this.queue.shift());
      }, this.config.delay);
    };

    looper(payload);
    return;
  }
}

export type EventKey = string | number;
export type DefaultEventPayload = { [key: string]: any };
export type EventCallbackFunction<PayloadType = DefaultEventPayload> = (
  payload?: PayloadType
) => void;

/**
 * @param {EventKey} key - Key/Name of the Event
 * @param {boolean} enabled - If Event is enabled or not
 * @param {number} maxUses - How often the event can be used
 * @param {number} delay - Delayed call of the event
 * @param {boolean} rerender - If triggering the Event should cause an rerender or not
 */
export interface EventConfig {
  key?: EventKey;
  enabled?: boolean;
  maxUses?: number;
  delay?: number;
  rerender?: boolean;
}
