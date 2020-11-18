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
   * @public
   *
   * @param tags -
   */
  public tag(tags: string[]) {
    if (includesArray(this.allowedTags, tags)) {
      return {
        log: (...logs: any[]) => this.log(logs),
        debug: (...logs: any[]) => this.debug(logs),
        info: (...logs: any[]) => this.info(logs),
        warn: (...logs: any[]) => this.warn(logs),
        error: (...logs: any[]) => this.error(logs),
        trace: (...logs: any[]) => this.trace(logs),
        table: (...logs: any[]) => this.table(logs),
      };
    }
    return {
      log: (...logs: any[]) => {},
      debug: (...logs: any[]) => {},
      info: (...logs: any[]) => {},
      warn: (...logs: any[]) => {},
      error: (...logs: any[]) => {},
      trace: (...logs: any[]) => {},
      table: (...logs: any[]) => {},
    };
  }

  public log(...logs: any[]) {
    this.invokeConsole(logs, "log", "log");
  }

  public debug(...logs: any[]) {
    this.invokeConsole(
      logs,
      "debug",
      typeof console.debug !== "undefined" ? "debug" : "log"
    );
  }

  public info(...logs: any[]) {
    this.invokeConsole(
      logs,
      "info",
      typeof console.info !== "undefined" ? "info" : "log"
    );
  }

  public warn(...logs: any[]) {
    this.invokeConsole(
      logs,
      "warn",
      typeof console.warn !== "undefined" ? "warn" : "log"
    );
  }

  public error(...logs: any[]) {
    this.invokeConsole(
      logs,
      "error",
      typeof console.error !== "undefined" ? "error" : "log"
    );
  }

  public trace(...logs: any[]) {
    this.invokeConsole(
      logs,
      "trace",
      typeof console.trace !== "undefined" ? "trace" : "log"
    );
  }

  public table(...logs: any[]) {
    this.invokeConsole(
      logs,
      "table",
      typeof console.table !== "undefined" ? "table" : "log"
    );
  }

  /**
   * @internal
   * Logs message in Console
   * @param logs -
   * @param loggerCategoryKey - Key of Logger Category
   * @param consoleLogProperty - console[consoleLogProperty]
   */
  private invokeConsole(
    logs: any[],
    loggerCategoryKey: LoggerCategoryKey,
    consoleLogProperty: ConsoleLogType
  ) {
    const loggerCategory = this.getLoggerCategory(loggerCategoryKey);
    const canUseCustomStyle =
      loggerCategory.customStyle && this.config.canUseCustomStyles;

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

    // TODOI think you can only use %c in ONE string block!!
    // https://stackoverflow.com/questions/24828107/javascript-adding-style-to-the-text-of-console-log
    // Add Custom Build Prefix
    logs.unshift(buildPrefix());

    // Init Custom Styles
    if (this.config.canUseCustomStyles && loggerCategory.customStyle) {
      const newLogs: any[] = [];
      logs.forEach((log) => {
        if (typeof log === "string") {
          newLogs.push(`%c${log}`);
          newLogs.push(loggerCategory.customStyle);
        }
      });
      logs = newLogs;
    }

    // Log
    console[consoleLogProperty](...logs);
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
