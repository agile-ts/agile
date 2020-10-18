import "mocha";
import { expect } from "chai";
import { Agile } from "../../../src";
import { useEvent_Test } from "../../test_integration";

describe("Trigger Function Tests", () => {
  let eventCallCount = 0;
  let currentEventPayload;
  let rerenderCount = 0;

  // Define Agile
  const App = new Agile();

  interface EventPayload {
    title: string;
    message: string;
  }

  // Create Event
  const MY_EVENT = App.Event<EventPayload>();

  MY_EVENT.on((payload) => {
    eventCallCount++;
    currentEventPayload = payload;
  }, "myEvent");

  // @ts-ignore
  useEvent_Test(
    MY_EVENT,
    (payload) => {
      eventCallCount++;
      currentEventPayload = payload;
    },
    () => {
      rerenderCount++;
    },
    "myEvent_useEvent"
  );

  it("Has correct initial value", () => {
    expect(MY_EVENT.uses).to.eq(0, "MY_EVENT uses has correct initial value");
    expect(JSON.stringify(MY_EVENT.config)).to.eq(
      JSON.stringify({ enabled: true, rerender: false }),
      "MY_EVENT has correct initial config"
    );
    expect(MY_EVENT.callbacks["myEvent"] !== undefined).to.eq(
      true,
      "MY_EVENT has 'myEvent' in callbacks"
    );
    expect(MY_EVENT.callbacks["myEvent_useEvent"] !== undefined).to.eq(
      true,
      "MY_EVENT has 'myEvent_useEvent' in callbacks"
    );
    expect(MY_EVENT.enabled).to.eq(true, "MY_EVENT is enabled");

    expect(eventCallCount).to.eq(0, "eventCallCount has correct initial size");
    expect(rerenderCount).to.eq(0, "rerenderCount has correct initial size");
    expect(currentEventPayload).to.eq(
      undefined,
      "currentEventPayload has correct initial value"
    );
  });

  it("Can trigger enabled Event", async () => {
    // Trigger Event
    MY_EVENT.trigger({ title: "Hello", message: "There" });

    expect(MY_EVENT.uses).to.eq(1, "MY_EVENT uses has been increased by 1");

    expect(eventCallCount).to.eq(2, "eventCallCount has been increased by 2");
    expect(rerenderCount).to.eq(0, "rerenderCount stayed the same");
    expect(JSON.stringify(currentEventPayload)).to.eq(
      JSON.stringify({
        title: "Hello",
        message: "There",
      }),
      "currentEventPayload has correct value"
    );
  });

  it("Can't trigger disabled Event", async () => {
    // Disable Event
    MY_EVENT.enabled = false;

    // Trigger Event
    MY_EVENT.trigger({ title: "Hello", message: "There" });

    expect(MY_EVENT.uses).to.eq(1, "MY_EVENT uses stayed the same");

    expect(eventCallCount).to.eq(2, "eventCallCount stayed the same");
    expect(rerenderCount).to.eq(0, "rerenderCount stayed the same");
    expect(JSON.stringify(currentEventPayload)).to.eq(
      JSON.stringify({
        title: "Hello",
        message: "There",
      }),
      "currentEventPayload has correct value"
    );
  });
});
