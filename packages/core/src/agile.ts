import { defineConfig } from '@agile-ts/utils';
import { logCodeManager } from './logCodeManager';
import { globalBind } from './utils';
import { Runtime, SubController } from './runtime';
import {
  Integration,
  Integrations,
  IntegrationsConfigInterface,
} from './integrations';

export class Agile {
  public config: AgileConfigInterface;

  // Key/Name identifier of Agile Instance
  public key?: AgileKey;

  // Queues and executes incoming Observer-based Jobs
  public runtime: Runtime;
  // Manages and simplifies the subscription to UI-Components
  public subController: SubController;

  // Integrations (UI-Frameworks) that are integrated into the Agile Instance
  public integrations: Integrations;

  // Identifier used to bind an Agile Instance globally
  static globalKey = '__agile__';

  /**
   * The Agile Class is the main Instance of AgileTs
   * and should be unique to your application.
   *
   * Simply put, the Agile Instance is the brain of AgileTs
   * and manages all [Agile Sub Instance](https://agile-ts.org/docs/introduction/#agile-sub-instance)
   * such as States.
   *
   * It should be noted that it doesn't store the States;
   * It only manages them. Each State has an Instance of the Agile Class,
   * for example, to ingest its changes into the Runtime.
   * In summary, the main tasks of the Agile Class are to:
   * - queue [Agile Sub Instance](https://agile-ts.org/docs/introduction/#agile-sub-instance)
   *   changes in the Runtime to prevent race conditions
   * - update/rerender subscribed UI-Components through the provided Integrations
   *   such as the [React Integration](https://agile-ts.org/docs/react)
   * - provide configuration object
   *
   * Each Agile Sub Instance requires an Agile Instance to be instantiated and function properly.
   *
   * [Learn more..](https://agile-ts.org/docs/core/agile-instance/)
   *
   * @public
   * @param config - Configuration object
   */
  constructor(config: CreateAgileConfigInterface = {}) {
    config = defineConfig(config, {
      localStorage: false,
      waitForMount: true,
      bindGlobal: false,
      autoIntegrate: true,
      bucket: true,
    });
    this.config = {
      waitForMount: config.waitForMount as any,
      bucket: config.bucket as any,
    };
    this.key = config.key;
    this.integrations = new Integrations(this, {
      autoIntegrate: config.autoIntegrate,
    });
    this.runtime = new Runtime(this);
    this.subController = new SubController(this);

    logCodeManager.log('10:00:00', {}, this);

    // Create a global instance of the Agile Instance.
    // Why? 'getAgileInstance()' returns the global Agile Instance
    // if it couldn't find any Agile Instance in the specified Instance.
    if (config.bindGlobal)
      if (!globalBind(Agile.globalKey, this)) {
        logCodeManager.log('10:02:00');
      }
  }

  /**
   * Registers the specified Integration with AgileTs.
   *
   * After a successful registration,
   * [Agile Sub Instances](https://agile-ts.org/docs/introduction/#agile-sub-instance) such as States
   * can be bound to the Integration's UI-Components for reactivity.
   *
   * [Learn more..](https://agile-ts.org/docs/core/agile-instance/methods#integrate)
   *
   * @public
   * @param integration - Integration to be integrated/registered.
   */
  public integrate(integration: Integration) {
    this.integrations.integrate(integration);
    return this;
  }

  /**
   * Returns a boolean indicating whether any Integration
   * has been registered with AgileTs or not.
   *
   * [Learn more..](https://agile-ts.org/docs/core/agile-instance/methods#hasintegration)
   *
   * @public
   */
  public hasIntegration(): boolean {
    return this.integrations.hasIntegration();
  }
}

export type AgileKey = string | number;

export interface CreateAgileConfigInterface
  extends IntegrationsConfigInterface {
  /**
   * Whether the Subscription Container shouldn't be ready
   * until the UI-Component it represents has been mounted.
   * @default true
   */
  waitForMount?: boolean;
  /**
   * Whether the Agile Instance should be globally bound (globalThis)
   * and thus be globally available.
   * @default false
   */
  bindGlobal?: boolean;
  /**
   * Key/Name identifier of the Agile Instance.
   * @default undefined
   */
  key?: AgileKey;
  /**
   * Whether to put render events into "The bucket" of the browser,
   * where all events are first put in wait for the UI thread
   * to be done with whatever it's doing.
   *
   * [Learn more..](https://stackoverflow.com/questions/9083594/call-settimeout-without-delay)
   * @default true
   */
  bucket?: boolean;
}

export interface AgileConfigInterface {
  /**
   * Whether the Subscription Container shouldn't be ready
   * until the UI-Component it represents has been mounted.
   * @default true
   */
  waitForMount: boolean;
  /**
   * Whether to put render events into "The bucket" of the browser,
   * where all events are first put in wait for the UI thread
   * to be done with whatever it's doing.
   *
   * [Learn more..](https://stackoverflow.com/questions/9083594/call-settimeout-without-delay)
   * @default true
   */
  bucket: boolean;
}
