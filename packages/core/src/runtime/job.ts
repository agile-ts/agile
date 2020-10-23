import { Observer, defineConfig } from "../internal";

export class Job<ObserverType extends Observer = Observer> {
  public observer: ObserverType;
  public config: JobConfigInterface;
  public rerender: boolean; // If Job will cause a rerender
  public performed: boolean = false; // If Job has been performed by Runtime

  /**
   * @internal
   * Job - Holds Observer and gets executed/performed by Runtime
   * @param observer - Observer that is represented by this Job and gets performed
   * @param config - Config
   */
  constructor(observer: ObserverType, config: JobConfigInterface) {
    this.config = defineConfig<JobConfigInterface>(config, {
      background: false,
      sideEffects: true,
      forceRerender: false,
    });
    this.config = config;
    this.observer = observer;
    this.rerender =
      !config.background &&
      this.observer.agileInstance().integrations.hasIntegration();
  }
}

/**
 * @param background - If Job gets executed in the background -> not causing any rerender
 * @param sideEffects - If SideEffects gets performed
 * @param perform - If Job gets performed immediately
 */
export interface JobConfigInterface {
  background?: boolean;
  sideEffects?: boolean;
  perform?: boolean;
}
