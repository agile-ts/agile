import "mocha";
import { expect } from "chai";
import { Agile } from "../../../../src";

describe("Reset Function Tests", () => {
  // Define Agile
  const App = new Agile();

  interface EventPayload {
    title: string;
    message: string;
  }

  // Create Event
  const MY_EVENT = App.Event<EventPayload>();

  // Trigger and disable Event
  MY_EVENT.trigger(undefined);
  MY_EVENT.trigger(undefined);
  MY_EVENT.disable();

  it("Has correct initial value", () => {
    expect(MY_EVENT.uses).to.eq(2, "MY_EVENT uses has correct initial value");
    expect(JSON.stringify(MY_EVENT.config)).to.eq(
      JSON.stringify({ rerender: false }),
      "MY_EVENT has correct initial config"
    );
    expect(MY_EVENT.enabled).to.eq(false, "MY_EVENT is disabled");
  });

  it("Can reset Event", () => {
    // Reset Event
    MY_EVENT.reset();

    expect(MY_EVENT.uses).to.eq(0, "MY_EVENT uses has been reset");
    expect(JSON.stringify(MY_EVENT.config)).to.eq(
      JSON.stringify({ rerender: false }),
      "MY_EVENT has correct config"
    );
    expect(MY_EVENT.enabled).to.eq(true, "MY_EVENT is enabled");
  });
});
