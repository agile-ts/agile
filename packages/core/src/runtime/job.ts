import {Worker} from "./worker";
import {defineConfig} from "../utils";

export interface JobConfigInterface {
    background?: boolean
    sideEffects?: boolean
    forceRerender?: boolean
}

export class Job<w = Worker> {

    public worker: w;
    public config: JobConfigInterface;
    public rerender: boolean;
    public performed: boolean = false;

    constructor(worker: w, config: JobConfigInterface) {
        // Merge default values into options
        this.config = defineConfig<JobConfigInterface>(config, {
            background: false,
            sideEffects: true,
            forceRerender: false
        });

        this.worker = worker;
        this.config = config;
        this.rerender = !config?.background || config?.forceRerender || true;
    }

}