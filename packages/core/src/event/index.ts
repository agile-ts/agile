import { Agile, defineConfig, generateId, isFunction } from "../internal";
import { EventObserver } from "./event.observer";

export class Event<PayloadType = DefaultEventPayload> {
  public agileInstance: () => Agile;

  public config: EventConfig;

  public _key?: EventKey;
  public uses: number = 0;
  public callbacks: { [key: string]: EventCallbackFunction<PayloadType> } = {}; // All 'subscribed' callback function
  private currentTimeout: any; // Timeout which is active right now (delayed Event)
  private queue: Array<PayloadType> = []; // Queue of delayed triggers
  public enabled: boolean = true;
  public observer: EventObserver;

  // @ts-ignore
  public payload: PayloadType; // Holds type of Payload so that it can be read external (never defined)

  /**
   * @public
   * Event -  Class that holds a List of Functions which can be triggered at the same time
   * @param agileInstance - An instance of Agile
   * @param config - Config
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

  /**
   * @public
   * Set Key/Name of Event
   */
  public set key(value: EventKey | undefined) {
    this._key = value;
    this.observer.key = value;
  }

  /**
   * @public
   * Get Key/Name of Event
   */
  public get key(): EventKey | undefined {
    return this._key;
  }

  //=========================================================================================================
  // On
  // https://stackoverflow.com/questions/12688275/is-there-a-way-to-do-method-overloading-in-typescript/12689054#12689054
  //=========================================================================================================
  /**
   * @public
   * Registers new Callback Function that will be called if this Event gets triggered
   * @param callback - Callback Function that gets called if the Event gets triggered
   * * @return Key of Event
   */
  public on(callback: EventCallbackFunction<PayloadType>): string;
  /**
   * @public
   * Registers new Callback Function that will be called if this Event gets triggered
   * @param key - Key of Callback Function
   * @param callback - Callback Function that gets called if the Event gets triggered
   */
  public on(key: string, callback: EventCallbackFunction<PayloadType>): this;
  public on(
    keyOrCallback: string | EventCallbackFunction<PayloadType>,
    callback?: EventCallbackFunction<PayloadType>
  ): this | string {
    const generateKey = isFunction(keyOrCallback);
    let _callback: EventCallbackFunction<PayloadType>;
    let key: string;

    if (generateKey) {
      key = generateId();
      _callback = keyOrCallback as EventCallbackFunction<PayloadType>;
    } else {
      key = keyOrCallback as string;
      _callback = callback as EventCallbackFunction<PayloadType>;
    }

    // Check if Callback is a Function
    if (!isFunction(_callback)) {
      Agile.logger.error("A Event Callback Function has to be an function!");
      return this;
    }

    // Check if Callback Function already exists
    if (this.callbacks[key]) {
      Agile.logger.error(
        `Event Callback Function with the key/name ${key} already exists!`
      );
      return this;
    }

    this.callbacks[key] = _callback;
    return generateKey ? key : this;
  }

  //=========================================================================================================
  // Trigger
  //=========================================================================================================
  /**
   * @public
   * Triggers Event
   * -> Calls all registered Callback Functions
   * @param payload - Payload that gets passed into the Callback Functions
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
   * Disables Event
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
   * Enables Event
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
   * Resets Event
   */
  public reset() {
    this.enabled = this.config.enabled || true;
    this.uses = 0;
    if (this.currentTimeout) clearTimeout(this.currentTimeout);
    return this;
  }

  //=========================================================================================================
  // Remove Callback
  //=========================================================================================================
  /**
   * @public
   * Removes Callback Function at given Key
   * @param key - Key of Callback Function that gets removed
   */
  public removeCallback(key: string): this {
    delete this.callbacks[key];
    return this;
  }

  //=========================================================================================================
  // Normal Trigger
  //=========================================================================================================
  /**
   * @internal
   * Triggers Event
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
   * Triggers Event with some delay (config.delay)
   */
  private delayedTrigger(payload?: PayloadType) {
    // Check if a Timeout is currently active if so add payload to queue
    if (this.currentTimeout !== undefined) {
      if (payload) this.queue.push(payload);
      return;
    }

    // Triggers Callback Functions and calls itself again if queue isn't empty
    const looper = (payload?: PayloadType) => {
      this.currentTimeout = setTimeout(() => {
        this.currentTimeout = undefined;
        this.normalTrigger(payload);
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
 * @param key - Key/Name of Event
 * @param enabled - If Event can be triggered
 * @param maxUses - How often the Event can be used/triggered
 * @param delay - Delayed call of Event Callback Functions in seconds
 * @param rerender - If triggering an Event should cause a rerender
 */
export interface EventConfig {
  key?: EventKey;
  enabled?: boolean;
  maxUses?: number;
  delay?: number;
  rerender?: boolean;
}
