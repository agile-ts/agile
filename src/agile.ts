import Runtime from "./runtime";
import use, {Integration} from "./integrations/use";
import SubController from "./sub";
import {State} from "./state";

export interface AgileConfig {
    framework?: any
    logJobs?: boolean
    waitForMount?: boolean
}

export default class Agile {

    public runtime: Runtime;
    public integration: Integration | null = null;
    public subController: SubController;

    constructor(public config: AgileConfig = {}) {
        this.subController = new SubController(this);
        this.runtime = new Runtime(this);

        // Init Framework
        if (config.framework)
            this.initFrameworkIntegration(config.framework);
        else
            console.warn("Agile: Don't forget to init a framework before using Agile")

        // Creates a global agile instance..
        this.globalBind();
    }


    //=========================================================================================================
    // Init Framework
    //=========================================================================================================
    /**
     * Init a Framework like React or a custom one
     */
    public initFrameworkIntegration(frameworkConstructor: any) {
        use(frameworkConstructor, this);
    }

    /**
     * Create Pulse state
     * @param initialState Any - the value to initialize a State instance with
     */
    public State = <T>(initialState: T) => new State<T>(this, initialState);

    //=========================================================================================================
    // Global Bind
    //=========================================================================================================
    /**
     * Global reference to the first pulse instance created this runtime
     */
    private globalBind() {
        try {
            // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/globalThis
            // @ts-ignore
            if (!globalThis.__agile) globalThis.__agile = this;
        } catch (error) {
            // fail silently
        }
    }
}


