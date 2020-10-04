import {Observer} from "./observer";
import {defineConfig} from "../utils";

export interface JobConfigInterface {
    background?: boolean
    sideEffects?: boolean
    forceRerender?: boolean
}

export class Job<o = Observer> {

    public observable: o;
    public config: JobConfigInterface;
    public rerender: boolean;
    public performed: boolean = false;

    constructor(observable: o, config: JobConfigInterface) {
        // Merge default values into options
        this.config = defineConfig<JobConfigInterface>(config, {
            background: false,
            sideEffects: true,
            forceRerender: false
        });

        this.observable = observable;
        this.config = config;
        this.rerender = !config?.background || config?.forceRerender || true;
    }

}