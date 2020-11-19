import {
  defineConfig,
  includesArray,
  isValidObject,
  generateId,
  isFunction,
} from "../internal";

export class Logger {
  public key?: LoggerKey;

  public config: LoggerConfigInterface;
  public allowedTags: string[] = [];
  public loggerCategories: { [key: string]: LoggerCategoryInterface } = {}; // Holds all registered Logger Categories
  public watchers: {
    [key: string]: LoggerWatcherConfigInterface;
  } = {};

  /**
   * @public
   * Logger - Handy Class to handle Logs
   */
  constructor(config: LoggerConfig = {}) {
    let _config = typeof config === "function" ? config(this) : config;
    _config = defineConfig(_config, {
      prefix: "",
      allowedTags: [],
      canUseCustomStyles: true,
      active: true,
      level: 0,
    });
    this.allowedTags = _config.allowedTags as any;
    this.config = {
      prefix: _config.prefix as any,
      canUseCustomStyles: _config.canUseCustomStyles as any,
      active: _config.active as any,
      level: _config.level as any,
    };
    this.addDefaultLoggerCategories();
  }

  /**
   * @public
   * Adds Conditions to Logs
   */
  public get if() {
    return {
      tag: (tags: string[]) => this.tag(tags),
    };
  }

  /**
   * @public
   * Handles Level of Logger
   */
  public get level() {
    return {
      TRACE: 1,
      DEBUG: 2,
      TABLE: 4,
      LOG: 5,
      INFO: 6,
      WARN: 10,
      ERROR: 20,
      set: (level: number) => (this.config.level = level),
    };
  }

  //=========================================================================================================
  // Add Default Logger Categories
  //=========================================================================================================
  /**
   * @internal
   * Adds Default Logger Categories
   */
  private addDefaultLoggerCategories() {
    this.createLoggerCategory({
      key: "log",
      level: this.level.LOG,
    });
    this.createLoggerCategory({
      key: "debug",
      customStyle: "color: #3c3c3c;",
      prefix: "Debug",
      level: this.level.DEBUG,
    });
    this.createLoggerCategory({
      key: "info",
      customStyle: "color: #1972ee;",
      prefix: "Info",
      level: this.level.INFO,
    });
    this.createLoggerCategory({
      key: "warn",
      prefix: "Warn",
      level: this.level.WARN,
    });
    this.createLoggerCategory({
      key: "error",
      prefix: "Error",
      level: this.level.ERROR,
    });
    this.createLoggerCategory({
      key: "trace",
      prefix: "Trace",
      level: this.level.TRACE,
    });
    this.createLoggerCategory({
      key: "table",
      level: this.level.TABLE,
    });
  }

  //=========================================================================================================
  // Tag
  //=========================================================================================================
  /**
   * @private
   * Only executes following 'command' if the given tags are allowed
   * @param tags - Tags
   */
  private tag(tags: string[]) {
    if (includesArray(this.allowedTags, tags)) {
      return {
        log: (...data: any[]) => this.log(...data),
        debug: (...data: any[]) => this.debug(...data),
        info: (...data: any[]) => this.info(...data),
        warn: (...data: any[]) => this.warn(...data),
        error: (...data: any[]) => this.error(...data),
        trace: (...data: any[]) => this.trace(...data),
        table: (...data: any[]) => this.table(...data),
      };
    }
    return {
      log: (...data: any[]) => {},
      debug: (...data: any[]) => {},
      info: (...data: any[]) => {},
      warn: (...data: any[]) => {},
      error: (...data: any[]) => {},
      trace: (...data: any[]) => {},
      table: (...data: any[]) => {},
    };
  }

  public log(...data: any[]) {
    this.invokeConsole(data, "log", "log");
  }

  public debug(...data: any[]) {
    this.invokeConsole(
      data,
      "debug",
      typeof console.debug !== "undefined" ? "debug" : "log"
    );
  }

  public info(...data: any[]) {
    this.invokeConsole(
      data,
      "info",
      typeof console.info !== "undefined" ? "info" : "log"
    );
  }

  public warn(...data: any[]) {
    this.invokeConsole(
      data,
      "warn",
      typeof console.warn !== "undefined" ? "warn" : "log"
    );
  }

  public error(...data: any[]) {
    this.invokeConsole(
      data,
      "error",
      typeof console.error !== "undefined" ? "error" : "log"
    );
  }

  public trace(...data: any[]) {
    this.invokeConsole(
      data,
      "trace",
      typeof console.trace !== "undefined" ? "trace" : "log"
    );
  }

  public table(...data: any[]) {
    this.invokeConsole(
      data,
      "table",
      typeof console.table !== "undefined" ? "table" : "log"
    );
  }

  public custom(loggerCategory: string, ...data: any[]) {
    this.invokeConsole(data, loggerCategory, "log");
  }

  //=========================================================================================================
  // Invoke Console
  //=========================================================================================================
  /**
   * @internal
   * Logs message in Console
   * @param data - Data that gets logged into the Console
   * @param loggerCategoryKey - Key of Logger Category
   * @param consoleLogProperty - console[consoleLogProperty]
   */
  private invokeConsole(
    data: any[],
    loggerCategoryKey: LoggerCategoryKey,
    consoleLogProperty: ConsoleLogType
  ) {
    const loggerCategory = this.getLoggerCategory(loggerCategoryKey);

    // Check if Logging is allowed
    if (!this.config.active || loggerCategory.level < this.config.level) return;

    // Build Prefix of Log
    const buildPrefix = (): string => {
      let prefix: string = "";
      if (this.config.prefix) prefix = prefix.concat(this.config.prefix);
      if (loggerCategory.prefix)
        prefix = prefix.concat(" " + loggerCategory.prefix);
      if (this.config.prefix || loggerCategory.prefix)
        prefix = prefix.concat(":");

      return prefix;
    };

    // Add Build Prefix (Have to do this this way because Styles can only be applied to one console.log block)
    if (typeof data[0] === "string")
      data[0] = buildPrefix().concat(" ").concat(data[0]);
    else data.unshift(buildPrefix());

    // Watch
    for (let key in this.watchers) {
      const watcher = this.watchers[key];
      if (loggerCategory.level >= (watcher.level || 0)) {
        watcher.callback(loggerCategory, data);
      }
    }

    // Init Custom Styles
    if (this.config.canUseCustomStyles && loggerCategory.customStyle) {
      const newLogs: any[] = [];
      let hasStyledString = false; // NOTE: Only one style can be init for one String block!
      for (let log of data) {
        if (typeof log === "string" && !hasStyledString) {
          newLogs.push(`%c${log}`);
          newLogs.push(loggerCategory.customStyle);
          hasStyledString = true;
        } else {
          newLogs.push(log);
        }
      }
      data = newLogs;
    }

    // Handle Console Table Log
    if (consoleLogProperty === "table") {
      if (typeof data[0] === "string") {
        console.log(data[0]);
        console.table(data.filter((d) => typeof d !== "string" && "number"));
      }
      return;
    }

    // Log
    console[consoleLogProperty](...data);
  }

  //=========================================================================================================
  // Create Logger Category
  //=========================================================================================================
  /**
   * @public
   * Create new Logger Category
   * @param loggerCategory - Message that gets Logged
   */
  public createLoggerCategory(loggerCategory: LoggerCategoryInterface) {
    loggerCategory = defineConfig(loggerCategory, {
      prefix: "",
      level: 0,
    });
    this.loggerCategories[loggerCategory.key] = loggerCategory;
  }

  //=========================================================================================================
  // Get Logger Category
  //=========================================================================================================
  /**
   * @public
   * Get Logger Category
   * @param key - Key/Name of Logger Category
   */
  public getLoggerCategory(key: LoggerCategoryKey) {
    return this.loggerCategories[key];
  }

  //=========================================================================================================
  // Watch
  //=========================================================================================================
  /**
   * @public
   * Watches Logger and detects Logs
   * @param config - Config
   * @return Key of Watcher
   */
  public watch(config: LoggerWatcherConfigInterface): string;
  /**
   * @public
   * Watches Logger and detects Logs
   * @param key - Key of Watcher Function
   * @param config - Config
   */
  public watch(key: string, config: LoggerWatcherConfigInterface): this;
  public watch(
    keyOrConfig: string | LoggerWatcherConfigInterface,
    config?: LoggerWatcherConfigInterface
  ): this | string {
    const generateKey = isValidObject(keyOrConfig);
    let _config: LoggerWatcherConfigInterface;
    let key: string;

    if (generateKey) {
      key = generateId();
      _config = keyOrConfig as LoggerWatcherConfigInterface;
    } else {
      key = keyOrConfig as string;
      _config = config as LoggerWatcherConfigInterface;
    }

    _config = defineConfig(_config, {
      level: 0,
    });

    // Check if Callback is a Function
    if (!isFunction(_config.callback)) {
      console.error(
        "Agile: A Watcher Callback Function has to be an function!"
      );
      return this;
    }

    // Check if Callback Function already exists
    if (this.watchers[key]) {
      console.error(
        `Agile: Watcher Callback Function with the key/name ${key} already exists!`
      );
      return this;
    }

    this.watchers[key] = _config;
    return generateKey ? key : this;
  }

  //=========================================================================================================
  // Remove Watcher
  //=========================================================================================================
  /**
   * @public
   * Removes Watcher at given Key
   * @param key - Key of Watcher that gets removed
   */
  public removeWatcher(key: string): this {
    delete this.watchers[key];
    return this;
  }
}

export type LoggerCategoryKey = string | number;
export type LoggerKey = string | number;

/**
 * @param key - Key/Name of Logger Category
 * @param customStyle - Css Styles that get applied to the log
 * @param prefix - Prefix that gets written before each log of this Category
 * @param level - Until which Level this Logger Category gets logged
 */
export interface LoggerCategoryInterface {
  key: LoggerCategoryKey;
  customStyle?: string;
  prefix?: string;
  level: number;
}

/**
 * @param prefix - Prefix that gets written before each log of this Logger
 * @param canUseCustomStyles - If custom Styles can be applied to the Logs
 */
export interface LoggerConfigInterface {
  prefix: string;
  canUseCustomStyles: boolean;
  level: number;
  active: boolean;
}

/**
 * @param prefix - Prefix that gets written before each log of this Logger
 * @param allowedTags - Only Logs that have contains the allowed Tags or have no Tag get logged
 * @param canUseCustomStyles - If custom Styles can be applied to the Logs
 */
export interface CreateLoggerConfigInterface {
  prefix?: string;
  allowedTags?: LoggerKey[];
  canUseCustomStyles?: boolean;
  active?: boolean;
  level?: number;
}

export type LoggerConfig =
  | CreateLoggerConfigInterface
  | ((logger: Logger) => CreateLoggerConfigInterface);

export type ConsoleLogType =
  | "log"
  | "warn"
  | "error"
  | "trace"
  | "table"
  | "info"
  | "debug";

export type LoggerWatcherCallback = (
  loggerCategory: LoggerCategoryInterface,
  data: any[]
) => void;

/**
 * @param callback - Callback Function that gets called if something gets Logged
 * @param level - At which level the watcher is called
 */
export interface LoggerWatcherConfigInterface {
  callback: LoggerWatcherCallback;
  level?: number;
}
