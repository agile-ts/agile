import { Agile } from "../../src";

jest.mock("../../src/runtime/index");
import { Runtime } from "../../src/runtime/index";

jest.mock("../../src/runtime/subscription/sub");
import { SubController } from "../../src/runtime/subscription/sub";

jest.mock("../../src/storages/index");
import { Storages } from "../../src/storages/index";

jest.mock("../../src/integrations/index");
import { Integrations } from "../../src/integrations/index";

// TODO can't find static properties of Logger after mocking Logger like the Logger.level property
// jest.mock("../../src/logger/index");
import { Logger } from "../../src/logger/index";

describe("Agile Tests", () => {
  const RuntimeMock = Runtime as jest.MockedClass<typeof Runtime>;

  const SubControllerMock = SubController as jest.MockedClass<
    typeof SubController
  >;
  const StoragesMock = Storages as jest.MockedClass<typeof Storages>;
  const IntegrationsMock = Integrations as jest.MockedClass<
    typeof Integrations
  >;
  // const LoggerMock = Logger as jest.MockedClass<typeof Logger>;

  beforeEach(() => {
    RuntimeMock.mockClear();
    SubControllerMock.mockClear();
    StoragesMock.mockClear();
    IntegrationsMock.mockClear();
    // LoggerMock.mockClear();
  });

  it("should instantiate Agile properties with default config", () => {
    const agile = new Agile();

    expect(agile.config).toStrictEqual({
      localStorage: true,
      logConfig: {
        prefix: "Agile",
        active: true,
        level: Logger.level.WARN,
        canUseCustomStyles: true,
        allowedTags: ["runtime", "storage", "subscription", "multieditor"],
      },
      waitForMount: false,
    });

    expect(IntegrationsMock).toHaveBeenCalledWith(agile);
    expect(agile.integrations).toBeInstanceOf(Integrations);

    expect(RuntimeMock).toHaveBeenCalledWith(agile);
    expect(agile.runtime).toBeInstanceOf(Runtime);

    expect(SubControllerMock).toHaveBeenCalledWith(agile);
    expect(agile.subController).toBeInstanceOf(SubController);

    expect(StoragesMock).toHaveBeenCalledWith(agile, {
      localStorage: agile.config.localStorage,
    });
    expect(agile.storages).toBeInstanceOf(Storages);

    expect(globalThis["__agile__"]).toBe(agile);
  });
});