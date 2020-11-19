import { defineConfig, includesArray } from "@agile-ts/core";

export class Logger {
  public key?: LoggerKey;

  public config: LoggerConfigInterface;
  public allowedTags: string[] = [];
  public loggerCategories: { [key: string]: LoggerCategoryInterface } = {}; // Holds all registered Logger Categories

  /**
   * @public
   * Logger -
   */
  constructor(config: CreateLoggerConfigInterface = {}) {
    config = defineConfig(config, {
      prefix: "",
      allowedTags: [],
      canUseCustomStyles: true,
    });
    this.allowedTags = config.allowedTags as any;
    this.config = {
      prefix: config.prefix as any,
      canUseCustomStyles: config.canUseCustomStyles as any,
    };
    this.addDefaultLoggerCategories();
  }

  /**
   * @public
   * Create conditions when a log can be logged
   */
  public get if() {
    return {
      tag: (tags: string[]) => this.tag(tags),
    };
  }

  /**
   * @internal
   * Adds Default Logger Categories
   */
  private addDefaultLoggerCategories() {
    this.createLoggerCategory({
      key: "log",
      level: 0,
    });
    this.createLoggerCategory({
      key: "debug",
      customStyle: "color: #3c3c3c;",
      prefix: "Debug",
      level: 0,
    });
    this.createLoggerCategory({
      key: "info",
      customStyle: "color: #1972ee;",
      prefix: "Info",
      level: 0,
    });
    this.createLoggerCategory({
      key: "warn",
      prefix: "Warn",
      level: 0,
    });
    this.createLoggerCategory({
      key: "error",
      prefix: "Error",
      level: 0,
    });
    this.createLoggerCategory({
      key: "trace",
      prefix: "Trace",
      level: 0,
    });
    this.createLoggerCategory({
      key: "table",
      level: 0,
    });
  }

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

  /**
   * @public
   * Get Logger Category
   * @param key - Key/Name of Logger Category
   */
  public getLoggerCategory(key: LoggerCategoryKey) {
    return this.loggerCategories[key];
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
  level?: number;
}

/**
 * @param prefix - Prefix that gets written before each log of this Logger
 * @param canUseCustomStyles - If custom Styles can be applied to the Logs
 */
export interface LoggerConfigInterface {
  prefix: string;
  canUseCustomStyles: boolean;
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
}

export type ConsoleLogType =
  | "log"
  | "warn"
  | "error"
  | "trace"
  | "table"
  | "info"
  | "debug";
