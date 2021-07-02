import { Agile, Integration, LogCodeManager } from '../internal';

const registeredExternalIntegrationsCallbacks: ((
  integration: Integration
) => void)[] = [];

export class Integrations {
  // Agile Instance the Integrations belongs to
  public agileInstance: () => Agile;

  // Registered Integrations
  public integrations: Set<Integration> = new Set();

  // External added Integrations that are to integrate into AgileTs,
  // with a proxy wrapped around to listen on external added Integrations.
  static initialIntegrations: Integration[] = new Proxy([], {
    set: (target, property, value) => {
      target[property] = value;

      // Executed external registered Integrations callbacks
      if (value instanceof Integration) {
        registeredExternalIntegrationsCallbacks.forEach((callback) =>
          callback(value)
        );
      }

      return true;
    },
  });

  /**
   * Fires on each external added Integration.
   *
   * @public
   * @param callback - Callback to be fired when an Integration was added externally.
   */
  static onRegisteredExternalIntegration(
    callback: (integration: Integration) => void
  ): void {
    registeredExternalIntegrationsCallbacks.push(callback);
  }

  /**
   * The Integrations Class manages all Integrations for an Agile Instance
   * and provides an interface to easily update
   * and invoke functions in all registered Integrations.
   *
   * @internal
   * @param agileInstance - Instance of Agile the Integrations belongs to.
   */
  constructor(agileInstance: Agile) {
    this.agileInstance = () => agileInstance;
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
    if (integration._key == null) {
      LogCodeManager.log('18:03:00', [integration._key], integration);
      return false;
    }

    // Bind to integrate Integration to AgileTs
    if (integration.methods.bind)
      integration.ready = await integration.methods.bind(this.agileInstance());
    else integration.ready = true;

    // Integrate Integration
    this.integrations.add(integration);
    integration.integrated = true;

    LogCodeManager.log('18:00:00', [integration._key], integration);

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
        LogCodeManager.log('18:02:00', [integration._key]);
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
