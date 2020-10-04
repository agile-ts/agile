import {Observer, defineConfig} from "../internal";

export interface JobConfigInterface {
    background?: boolean
    sideEffects?: boolean
    forceRerender?: boolean
    perform?: boolean
}

export class Job<o = Observer> {

    public observer: o;
    public config: JobConfigInterface;
    public rerender: boolean;
    public performed: boolean = false;

    constructor(observer: o, config: JobConfigInterface) {
        // Merge default values into options
        this.config = defineConfig<JobConfigInterface>(config, {
            background: false,
            sideEffects: true,
            forceRerender: false
        });

        this.observer = observer;
        this.config = config;
        this.rerender = !config?.background || config?.forceRerender || true;
    }

}