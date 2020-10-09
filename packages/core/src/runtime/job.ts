import {Observer, defineConfig} from "../internal";

export interface JobConfigInterface {
    background?: boolean // If it should cause an rerender
    sideEffects?: boolean // If it should call sideEffects
    forceRerender?: boolean // Force a rerender
    perform?: boolean // If the Job should be performed
}

export class Job<ObserverType = Observer> {

    public observer: ObserverType;
    public config: JobConfigInterface;
    public rerender: boolean;
    public performed: boolean = false;

    constructor(observer: ObserverType, config: JobConfigInterface) {
        this.config = defineConfig<JobConfigInterface>(config, {
            background: false,
            sideEffects: true,
            forceRerender: false
        });

        this.observer = observer;
        this.config = config;

        // @ts-ignore
        this.rerender = (!config.background || config.forceRerender) && this.observer.agileInstance().integrations.hasIntegration();
    }
}