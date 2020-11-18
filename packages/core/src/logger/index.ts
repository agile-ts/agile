import { defineConfig, includesArray } from "../internal";

export class Logger {
  public key?: LoggerKey;

  public config: LoggerConfigInterface;
  public allowedTags: string[] = [];
  public logs: { [key: string]: LoggerCategoryInterface } = {};

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

  private addDefaultLoggerCategories() {
    this.addLoggerCategory({
      key: "debug",
      customStyle: "color: #3c3c3c;",
      prefix: "Debug:",
      level: 0,
    });
    this.addLoggerCategory({
      key: "info",
      customStyle: "color: #19a8ee;",
      prefix: "Info:",
      level: 0,
    });
    this.addLoggerCategory({
      key: "warn",
      prefix: "Warn:",
      level: 0,
    });
    this.addLoggerCategory({
      key: "error",
      prefix: "Error:",
      level: 0,
    });
    this.addLoggerCategory({
      key: "trace",
      prefix: "Trace:",
      level: 0,
    });
    this.addLoggerCategory({
      key: "table",
      level: 0,
    });
  }

  public tag(tags: string[]) {
    if (includesArray(this.allowedTags, tags)) {
      return {
        debug: (message: string, object?: any) => this.debug(message, object),
        info: (message: string, object?: any) => this.info(message, object),
        warn: (message: string, object?: any) => this.warn(message, object),
        error: (message: string, object?: any) => this.error(message, object),
        trace: (message: string, object?: any) => this.trace(message, object),
        table: (message: string, object?: any) => this.table(message, object),
      };
    }
    return {
      debug: (message: string, object?: any) => {},
      info: (message: string, object?: any) => {},
      warn: (message: string, object?: any) => {},
      error: (message: string, object?: any) => {},
      trace: (message: string, object?: any) => {},
      table: (message: string, object?: any) => {},
    };
  }

  public debug(message: string, object?: any) {
    this.log(message, object, "debug", "log");
  }

  public info(message: string, object?: any) {
    this.log(message, object, "info", "log");
  }

  public warn(message: string, object?: any) {
    this.log(message, object, "warn", "warn");
  }

  public error(message: string, object?: any) {
    this.log(message, object, "error", "error");
  }

  public trace(message: string, object?: any) {
    this.log(message, object, "trace", "trace");
  }

  public table(message: string, object: object, canLog?: boolean) {
    this.log(message, object, "table", "table");
  }

  private log(
    message: string,
    object: any,
    loggerCategoryKey: LoggerCategoryKey,
    consoleLogProperty: "log" | "warn" | "error" | "trace" | "table"
  ) {
    const loggerCategory = this.getLoggerCategory(loggerCategoryKey);
    const canUseCustomStyle =
      loggerCategory.customStyle && this.config.canUseCustomStyles;
    const categoryPrefix = loggerCategory.prefix
      ? `${loggerCategory.prefix} `
      : "";
    const loggerPrefix = this.config.prefix ? `${this.config.prefix} ` : "";
    const customStylesPrefix =
      loggerCategory.customStyle && this.config.canUseCustomStyles ? "%c" : "";

    if (object && canUseCustomStyle) {
      console[consoleLogProperty](
        `${customStylesPrefix}${loggerPrefix}${categoryPrefix}${message}\n`,
        loggerCategory.customStyle,
        object
      );
      return;
    }

    if (object) {
      console[consoleLogProperty](
        `${customStylesPrefix}${loggerPrefix}${categoryPrefix}${message}\n`,
        object
      );
      return;
    }

    if (canUseCustomStyle) {
      console[consoleLogProperty](
        `${customStylesPrefix}${loggerPrefix}${categoryPrefix}${message}`,
        loggerCategory.customStyle
      );
      return;
    }

    console[consoleLogProperty](
      `${customStylesPrefix}${loggerPrefix}${categoryPrefix}${message}`
    );
  }

  public addLoggerCategory(loggerCategory: LoggerCategoryInterface) {
    loggerCategory = defineConfig(loggerCategory, {
      color: "#000000",
      prefix: "",
      tags: [],
    });
    this.logs[loggerCategory.key] = loggerCategory;
  }

  public getLoggerCategory(key: LoggerCategoryKey) {
    return this.logs[key];
  }
}

export type LoggerCategoryKey = string | number;
export type LoggerKey = string | number;

export interface LoggerCategoryInterface {
  key: LoggerCategoryKey;
  customStyle?: string;
  prefix?: string;
  tags?: string[];
  level?: number;
}

export interface LoggerConfigInterface {
  prefix: string;
  canUseCustomStyles: boolean;
}

export interface CreateLoggerConfigInterface {
  prefix?: string;
  allowedTags?: LoggerKey[];
  canUseCustomStyles?: boolean;
}
