import { defineConfig } from '@agile-ts/utils';
import { logCodeManager } from '../logCodeManager';
import type { Agile } from '../agile';
import { Integration } from './integration';

const onRegisterInitialIntegrationCallbacks: ((
  integration: Integration
) => void)[] = [];

export class Integrations {
  // Agile Instance the Integrations belongs to
  public agileInstance: () => Agile;

  // Registered Integrations
  public integrations: Set<Integration> = new Set();

  // External added Integrations
  // that are to integrate into not yet existing Agile Instances
  static initialIntegrations: Integration[] = [];

  /**
   * Registers the specified Integration in each existing or not-yet created Agile Instance.
   *
   * @public
   * @param integration - Integration to be registered in each Agile Instance.
   */
  static addInitialIntegration(integration: Integration): void {
    if (integration instanceof Integration) {
      // Executed external registered Integration callbacks
      onRegisterInitialIntegrationCallbacks.forEach((callback) =>
        callback(integration)
      );

      Integrations.initialIntegrations.push(integration);
    }
  }

  /**
   * Fires on each external added Integration.
   *
   * @public
   * @param callback - Callback to be fired when an Integration was externally added.
   */
  static onRegisterInitialIntegration(
    callback: (integration: Integration) => void
  ): void {
    onRegisterInitialIntegrationCallbacks.push(callback);
    Integrations.initialIntegrations.forEach((integration) => {
      callback(integration);
    });
  }

  /**
   * The Integrations Class manages all Integrations for an Agile Instance
   * and provides an interface to easily update
   * and invoke functions in all registered Integrations.
   *
   * @internal
   * @param agileInstance - Instance of Agile the Integrations belongs to.
   * @param config - Configuration object
   */
  constructor(agileInstance: Agile, config: IntegrationsConfigInterface = {}) {
    config = defineConfig(config, {
      autoIntegrate: true,
    });
    this.agileInstance = () => agileInstance;

    if (config.autoIntegrate) {
      // Setup listener to be notified when an external registered Integration was added
      Integrations.onRegisterInitialIntegration((integration) => {
        this.integrate(integration);
      });
    }
  }

  /**
   * Integrates the specified Integration into AgileTs
   * and sets it to ready when the binding was successful.
   *
   * @public
   * @param integration - Integration to be integrated into AgileTs.
   */
  public async integrate(integration: Integration): Promise<boolean> {
    // Check if Integration is valid
    if (integration.key == null) {
      if (process.env.NODE_ENV !== 'production') {
        logCodeManager.log(
          '18:03:00',
          { replacers: [integration.key, this.agileInstance().key] },
          integration
        );
      }
      return false;
    }

    // Bind to integrate Integration to AgileTs
    if (integration.methods.bind)
      integration.ready = await integration.methods.bind(this.agileInstance());
    else integration.ready = true;

    // Integrate Integration
    this.integrations.add(integration);
    integration.integrated = true;

    if (process.env.NODE_ENV !== 'production') {
      logCodeManager.log(
        '18:00:00',
        { replacers: [integration.key, this.agileInstance().key] },
        integration
      );
    }

    return true;
  }

  /**
   * Updates the specified UI-Component Instance
   * with the updated data object in all registered Integrations that are ready.
   *
   * In doing so, it calls the `updateMethod()` method
   * in all registered Integrations with the specified parameters.
   *
   * @public
   * @param componentInstance - Component Instance to be updated.
   * @param updatedData - Data object with updated data.
   */
  public update(componentInstance: any, updatedData: Object): void {
    this.integrations.forEach((integration) => {
      if (!integration.ready) {
        logCodeManager.log('18:02:00', { replacers: [integration.key] });
        return;
      }
      if (integration.methods.updateMethod)
        integration.methods.updateMethod(componentInstance, updatedData);
    });
  }

  /**
   * Returns a boolean indicating whether any Integration
   * has been registered with the Agile Instance or not.
   *
   * @public
   */
  public hasIntegration(): boolean {
    return this.integrations.size > 0;
  }
}

export interface IntegrationsConfigInterface {
  /**
   * Whether external added Integrations
   * are to integrate automatically into the Integrations Class.
   * For example, when the package '@agile-ts/react' was installed,
   * whether to automatically integrate the 'reactIntegration'.
   * @default true
   */
  autoIntegrate?: boolean;
}
