import Agile from "../../index";
import {Integration} from "../use";


//=========================================================================================================
// Framework Integration
//=========================================================================================================

const reactIntegration: Integration = {
    name: 'react',
    bind(agileInstance: Agile) {
        // Not sure if usePulse should get into the pulseInstance
        // pulseInstance.usePulse = (deps: Array<State>) => usePulse(deps, pulseInstance);
        // if (agileInstance.config.logJobs) console.log("Agile: Successfully binded React to Agile")
    },
    updateMethod(componentInstance: any, updatedData: Object) {
        // UpdatedData will be empty if the AgileHOC doesn't get an object as deps

        if (Object.keys(updatedData).length !== 0) {
            // Update Props
            componentInstance.updatedProps = {...componentInstance.updatedProps, ...updatedData};

            // Set State
            componentInstance.setState(updatedData);
        } else {
            componentInstance.forceUpdate();
        }
    }
};

export default reactIntegration;
