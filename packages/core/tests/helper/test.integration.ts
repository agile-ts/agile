import { Agile, Integration } from "../../src";

const testIntegration = new Integration({
  name: "test",
  frameworkInstance: null,
  bind(agileInstance: Agile) {
    // Nothing to bind ;D
    return true;
  },
  updateMethod(componentInstance: any, updatedData: Object) {
    // Nothing
  },
});

export default testIntegration;
