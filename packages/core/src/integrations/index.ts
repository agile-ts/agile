import { Agile, Integration } from '../internal';

export class Integrations {
  public agileInstance: () => Agile;

  public integrations: Set<Integration> = new Set(); // All registered Integrations

  /**
   * @internal
   * Integrations - Manages Integrations of Agile
   * @param agileInstance - An Instance of Agile
   */
  constructor(agileInstance: Agile) {
    this.agileInstance = () => agileInstance;

    // Integrate initial Integrations which are static and got set external
    Agile.initialIntegrations.forEach((integration) =>
      this.integrate(integration)
    );
  }

  //=========================================================================================================
  // Integrate
  //=========================================================================================================
  /**
   * @internal
   * Integrates Framework(Integration) into Agile
   * @param integration - Integration/Framework that gets integrated
   */
  public async integrate(integration: Integration): Promise<boolean> {
    // Check if Integration is valid
    if (!integration._key) {
      Agile.logger.error(
        'Failed to integrate framework! Invalid Integration!',
        integration._key
      );
      return false;
    }

    // Bind Framework to Agile
    if (integration.methods.bind)
      integration.ready = await integration.methods.bind(this.agileInstance());
    else integration.ready = true;

    // Integrate Framework
    this.integrations.add(integration);
    integration.integrated = true;

    // Logging
    Agile.logger.success(`Successfully integrated '${integration._key}'`);

    return true;
  }

  //=========================================================================================================
  // Update
  //=========================================================================================================
  /**
   * @internal
   * Updates registered and ready Integrations
   * -> calls 'updateMethod' in all registered and ready Integrations
   * @param componentInstance - Component that gets updated
   * @param updatedData - Properties that differ from the last Value
   */
  public update(componentInstance: any, updatedData: Object): void {
    this.integrations.forEach((integration) => {
      if (!integration.ready) {
        Agile.logger.warn(`Integration '${integration.key}' isn't ready yet!`);
        return;
      }
      if (integration.methods.updateMethod)
        integration.methods.updateMethod(componentInstance, updatedData);
    });
  }

  //=========================================================================================================
  // Has Integration
  //=========================================================================================================
  /**
   * @internal
   *  Check if at least one Integration got registered
   */
  public hasIntegration(): boolean {
    return this.integrations.size > 0;
  }
}
