import { Observer, defineConfig } from "../internal";

export class Job<ObserverType extends Observer = Observer> {
  public observer: ObserverType;
  public config: JobConfigInterface;
  public rerender: boolean; // If it should cause a rerender
  public performed: boolean = false; // If it has already been performed

  /**
   * Job - Will be created by runtime and represents a job which will than be executed by it
   * @param {Observer} observer - Observer which is represented by this job and get performed
   * @param {JobConfigInterface} config - Config
   */
  constructor(observer: ObserverType, config: JobConfigInterface) {
    this.config = defineConfig<JobConfigInterface>(config, {
      background: false,
      sideEffects: true,
      forceRerender: false,
    });

    this.observer = observer;
    this.config = config;
    this.rerender =
      !config.background &&
      this.observer.agileInstance().integrations.hasIntegration();
  }
}

/**
 * @param {boolean} background - If assigning a new value should happen in the background -> not causing a rerender
 * @param {boolean} sideEffects - If it should execute sideEffects
 * @param {boolean} perform - If it should perform the Job immediately
 */
export interface JobConfigInterface {
  background?: boolean;
  sideEffects?: boolean;
  perform?: boolean;
}
