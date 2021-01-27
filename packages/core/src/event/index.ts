import {
  Agile,
  defineConfig,
  EventJob,
  generateId,
  isFunction,
  Observer,
} from '../internal';
import { EventObserver } from './event.observer';

export class Event<PayloadType = DefaultEventPayload> {
  public agileInstance: () => Agile;

  public config: EventConfigInterface;
  private initialConfig: CreateEventConfigInterface;

  public _key?: EventKey;
  public uses = 0;
  public callbacks: { [key: string]: EventCallbackFunction<PayloadType> } = {}; // All 'subscribed' callback function
  public enabled = true;
  public observer: EventObserver;

  public currentTimeout: any; // Timeout that is active right now (delayed Event)
  public queue: Array<EventJob> = []; // Queue of delayed Events

  // @ts-ignore
  public payload: PayloadType; // Holds type of Payload so that it can be read external (never defined)

  /**
   * @public
   * Event -  Class that holds a List of Functions which can be triggered at the same time
   * @param agileInstance - An instance of Agile
   * @param config - Config
   */
  constructor(agileInstance: Agile, config: CreateEventConfigInterface = {}) {
    this.agileInstance = () => agileInstance;
    config = defineConfig<CreateEventConfigInterface>(config, {
      enabled: true,
      rerender: false,
      maxUses: undefined,
      delay: undefined,
      overlap: false,
      dependents: [],
    });
    this._key = config.key;
    this.observer = new EventObserver(this, {
      key: config.key,
      dependents: config.dependents,
    });
    this.enabled = config.enabled as any;
    this.config = {
      rerender: config.rerender as any,
      delay: config.delay,
      maxUses: config.maxUses,
      overlap: config.overlap,
    };
    this.initialConfig = config;
  }

  /**
   * @public
   * Set Key/Name of Event
   */
  public set key(value: EventKey | undefined) {
    this.setKey(value);
  }

  /**
   * @public
   * Get Key/Name of Event
   */
  public get key(): EventKey | undefined {
    return this._key;
  }

  //=========================================================================================================
  // Set Key
  //=========================================================================================================
  /**
   * @internal
   * Set Key/Name of Event
   * @param value - New Key/Name of Event
   */
  public setKey(value: EventKey | undefined): this {
    this._key = value;
    this.observer._key = value;
    return this;
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
      Agile.logger.error(
        'A Event Callback Function has to be typeof Function!'
      );
      return this;
    }

    // Check if Callback Function already exists
    if (this.callbacks[key]) {
      Agile.logger.error(
        `Event Callback Function with the key/name '${key}' already exists!`
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
   * Triggers Events
   * @param payload - Payload that gets passed into the Callback Functions
   * @param keys - Keys of Callback Functions that get triggered (Note: if not passed all registered Events will be triggered)
   */
  public trigger(payload: PayloadType, keys?: string[]) {
    if (!this.enabled) return this;
    if (this.config.delay)
      this.delayedTrigger(payload, this.config.delay, keys);
    else this.normalTrigger(payload, keys);
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
    this.enabled = this.initialConfig.enabled as any;
    this.uses = 0;
    if (this.currentTimeout) {
      clearTimeout(this.currentTimeout);
      this.currentTimeout = undefined;
    }
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
   * Triggers normal Event
   * @param payload - Payload that gets passed into the Callback Functions
   * @param keys - Keys of Callback Functions that get triggered (Note: if not passed all registered Events will be triggered)
   */
  public normalTrigger(payload: PayloadType, keys?: string[]) {
    // Call wished Callback Functions
    if (!keys) {
      for (const key in this.callbacks) this.callbacks[key](payload);
    } else {
      for (const key of keys) {
        if (this.callbacks[key]) this.callbacks[key](payload);
      }
    }

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
   * Triggers async Event (Events with a delay)
   * @param payload - Payload that gets passed into the Callback Functions
   * @param delay - Delay until Events get triggered
   * @param keys - Keys of Callback Functions that get triggered (Note: if not passed all registered Events will be triggered)
   */
  public delayedTrigger(payload: PayloadType, delay: number, keys?: string[]) {
    const eventJob = new EventJob<PayloadType>(payload, keys);

    // Execute Event no matter if another event is currently active
    if (this.config.overlap) {
      setTimeout(() => {
        this.normalTrigger(eventJob.payload, eventJob.keys);
      }, delay);
      return;
    }

    // Check if a Event(Timeout) is currently active if so add EventJob to queue
    if (this.currentTimeout !== undefined) {
      if (payload) this.queue.push(eventJob);
      return;
    }

    // Executes EventJob and calls itself again if queue isn't empty to execute the next EventJob
    const looper = (eventJob: EventJob<PayloadType>) => {
      this.currentTimeout = setTimeout(() => {
        this.currentTimeout = undefined;
        this.normalTrigger(eventJob.payload, eventJob.keys);
        if (this.queue.length > 0) {
          const nextEventJob = this.queue.shift();
          if (nextEventJob) looper(nextEventJob);
        }
      }, delay);
    };

    looper(eventJob);
    return;
  }
}

export type EventKey = string | number;
export type DefaultEventPayload = { [key: string]: any };
export type EventCallbackFunction<PayloadType = DefaultEventPayload> = (
  payload: PayloadType
) => void;

/**
 * @param key - Key/Name of Event
 * @param enabled - If Event can be triggered
 * @param maxUses - How often the Event can be used/triggered
 * @param delay - Delayed call of Event Callback Functions in milliseconds
 * @param overlap - If Events can overlap
 * @param rerender - If triggering an Event should cause a rerender
 * @param deps - Initial Dependents of Event
 */
export interface CreateEventConfigInterface {
  key?: EventKey;
  enabled?: boolean;
  maxUses?: number;
  delay?: number;
  overlap?: boolean;
  rerender?: boolean;
  dependents?: Array<Observer>;
}

/**
 * @param maxUses - How often the Event can be used/triggered
 * @param delay - Delayed call of Event Callback Functions in seconds
 * @param overlap - If Events can overlap
 * @param rerender - If triggering an Event should cause a rerender
 */
export interface EventConfigInterface {
  maxUses?: number;
  delay?: number;
  overlap?: boolean;
  rerender: boolean;
}
