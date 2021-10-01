import { defineConfig, generateId, includesArray } from '@agile-ts/utils';

export class Logger {
  public config: LoggerConfigInterface;

  // Key/Name identifier of the Logger
  public key?: LoggerKey;

  // Whether the Logger is active and can log
  public isActive: boolean;
  // Registered Logger Categories (type of log messages)
  public loggerCategories: { [key: string]: LoggerCategoryInterface } = {};
  // Registered watcher callback
  public watchers: {
    [key: string]: LoggerWatcherConfigInterface;
  } = {};

  /**
   * Practical class for handling advanced logging
   * with e.g. different types of logs or filtering.
   *
   * @public
   * @param config - Configuration object
   */
  constructor(config: LoggerConfig = {}) {
    let _config = typeof config === 'function' ? config(this) : config;
    _config = defineConfig(_config, {
      prefix: '',
      allowedTags: [],
      canUseCustomStyles: true,
      active: true,
      level: 0,
      timestamp: false,
    });
    this.isActive = _config.active as any;
    this.config = {
      timestamp: _config.timestamp as any,
      prefix: _config.prefix as any,
      canUseCustomStyles: _config.canUseCustomStyles as any,
      level: _config.level as any,
      allowedTags: _config.allowedTags as any,
    };

    // Assign default Logger categories to the Logger
    this.createLoggerCategory({
      key: 'log',
      level: Logger.level.LOG,
    });
    this.createLoggerCategory({
      key: 'debug',
      customStyle: 'color: #656565;',
      prefix: 'Debug',
      level: Logger.level.DEBUG,
    });
    this.createLoggerCategory({
      key: 'info',
      customStyle: 'color: #6c69a0;',
      prefix: 'Info',
      level: Logger.level.INFO,
    });
    this.createLoggerCategory({
      key: 'success',
      customStyle: 'color: #00b300;',
      prefix: 'Success',
      level: Logger.level.SUCCESS,
    });
    this.createLoggerCategory({
      key: 'warn',
      prefix: 'Warn',
      level: Logger.level.WARN,
    });
    this.createLoggerCategory({
      key: 'error',
      prefix: 'Error',
      level: Logger.level.ERROR,
    });
    this.createLoggerCategory({
      key: 'table',
      level: Logger.level.TABLE,
    });
  }

  /**
   * Default log level of the Logger.
   *
   * The log level determines which type of logs can be logged.
   *
   * @public
   */
  static get level() {
    return {
      DEBUG: 2,
      LOG: 5,
      TABLE: 5,
      INFO: 10,
      SUCCESS: 15,
      WARN: 20,
      ERROR: 50,
    };
  }

  /**
   * Lays the foundation for a conditional log.
   *
   * @public
   */
  public get if() {
    return {
      /**
       * Only executes the following action
       * if all given tags are allowed to be logged.
       *
       * @internal
       * @param tags - Tags to be allowed.
       */
      tag: (tags: string[]) => this.tag(tags),
    };
  }

  /**
   * Only executes the following action
   * if all given tags are allowed to be logged.
   *
   * @internal
   * @param tags - Tags to be allowed.
   */
  private tag(tags: string[]): DefaultLogMethodsInterface {
    return this.logIfCondition(includesArray(this.config.allowedTags, tags));
  }

  /**
   * Returns an array of the default log methods if the specified condition is true.
   *
   * @param condition
   * @private
   */
  private logIfCondition(condition: boolean): DefaultLogMethodsInterface {
    const defaultLoggerCategories = Object.keys(
      Logger.level
    ).map((loggerCategory) => loggerCategory.toLowerCase());

    // Build object representing taggable log methods
    const finalObject: DefaultLogMethodsInterface = {} as any;
    for (const loggerCategory of defaultLoggerCategories) {
      finalObject[loggerCategory] = condition
        ? (...data) => this[loggerCategory](...data)
        : () => {
            /* do nothing */
          };
    }

    return finalObject;
  }

  /**
   * Prints to stdout with newline.
   *
   * @public
   * @param data - Data to be logged.
   */
  public log(...data: any[]) {
    this.invokeConsole(data, 'log', 'log');
  }

  /**
   * The 'logger.debug()' function is an alias for 'logger.log()'.
   *
   * @public
   * @param data - Data to be logged.
   */
  public debug(...data: any[]) {
    this.invokeConsole(
      data,
      'debug',
      typeof console.debug !== 'undefined' ? 'debug' : 'log'
    );
  }

  /**
   * The 'logger.info()' function is an alias for 'logger.log()'.
   *
   * @public
   * @param data - Data to be logged.
   */
  public info(...data: any[]) {
    this.invokeConsole(
      data,
      'info',
      typeof console.info !== 'undefined' ? 'info' : 'log'
    );
  }

  /**
   * The 'logger.success()' function is an alias for 'logger.log()'.
   *
   * @public
   * @param data - Data to be logged.
   */
  public success(...data: any[]) {
    this.invokeConsole(data, 'success', 'log');
  }

  /**
   * The 'logger.warn()' function is an alias for 'logger.error()'.
   *
   * @public
   * @param data - Data to be logged.
   */
  public warn(...data: any[]) {
    this.invokeConsole(
      data,
      'warn',
      typeof console.warn !== 'undefined' ? 'warn' : 'log'
    );
  }

  /**
   * Prints to stderr with newline.
   *
   * @public
   * @param data - Data to be logged.
   */
  public error(...data: any[]) {
    this.invokeConsole(
      data,
      'error',
      typeof console.error !== 'undefined' ? 'error' : 'log'
    );
  }

  /**
   * Prints the specified object in a visual table.
   *
   * @public
   * @param data - Data to be logged.
   */
  public table(...data: any[]) {
    this.invokeConsole(
      data,
      'table',
      typeof console.table !== 'undefined' ? 'table' : 'log'
    );
  }

  /**
   * Prints a log message based on the specified logger category.
   *
   * @public
   * @param loggerCategory - Logger category to be logged.
   * @param data - Data to be logged.
   */
  public custom(loggerCategory: string, ...data: any[]) {
    this.invokeConsole(data, loggerCategory, 'log');
  }

  /**
   * Internal method for logging the data
   * into the console based on the specified logger category.
   *
   * @internal
   * @param data - Data to be logged.
   * @param loggerCategoryKey - Key/Name of the Logger Category.
   * @param consoleLogType - What type of log to be logged (console[consoleLogType]).
   */
  private invokeConsole(
    data: any[],
    loggerCategoryKey: LoggerCategoryKey,
    consoleLogType: ConsoleLogType
  ) {
    const loggerCategory = this.getLoggerCategory(loggerCategoryKey);

    if (!this.isActive || loggerCategory.level < this.config.level) return;

    // Build log prefix
    const buildPrefix = (): string => {
      let prefix = '';
      if (this.config.timestamp)
        prefix = prefix.concat(`[${Date.now().toString()}] `);
      if (this.config.prefix) prefix = prefix.concat(this.config.prefix);
      if (loggerCategory.prefix)
        prefix = prefix.concat(' ' + loggerCategory.prefix);
      if (this.config.prefix || loggerCategory.prefix)
        prefix = prefix.concat(':');
      return prefix;
    };

    // Add built log prefix to the to log data
    if (typeof data[0] === 'string')
      data[0] = buildPrefix().concat(' ').concat(data[0]);
    else data.unshift(buildPrefix());

    // Call watcher callbacks
    for (const key in this.watchers) {
      const watcher = this.watchers[key];
      if (loggerCategory.level >= watcher.level) {
        watcher.callback(loggerCategory, data);
      }
    }

    // Init custom styling provided by the Logger category
    if (this.config.canUseCustomStyles && loggerCategory.customStyle) {
      const newLogs: any[] = [];
      let didStyle = false; // Because only one string part of a log can be styled
      for (const log of data) {
        if (!didStyle && typeof log === 'string') {
          newLogs.push(`%c${log}`);
          newLogs.push(loggerCategory.customStyle);
          didStyle = true;
        } else {
          newLogs.push(log);
        }
      }
      data = newLogs;
    }

    // Handle table log
    if (consoleLogType === 'table') {
      for (const log of data)
        console[typeof log === 'object' ? 'table' : 'log'](log);
    }
    // Handle 'normal' log
    else {
      console[consoleLogType](...data);
    }
  }

  /**
   * Creates a new Logger category and assigns it to the Logger.
   *
   * @public
   * @param loggerCategory - Logger category to be added to the Logger.
   */
  public createLoggerCategory(loggerCategory: LoggerCategoryInterface) {
    loggerCategory = {
      prefix: '',
      ...loggerCategory,
    };
    this.loggerCategories[loggerCategory.key] = loggerCategory;
  }

  /**
   * Retrieves a single Logger category with the specified key/name identifier from the Logger.
   *
   * If the to retrieve Logger category doesn't exist, `undefined` is returned.
   *
   * @public
   * @param categoryKey - Key/Name identifier of the Item.
   */
  public getLoggerCategory(categoryKey: LoggerCategoryKey) {
    return this.loggerCategories[categoryKey];
  }

  /**
   * Fires on each logged message of the Logger.
   *
   * @public
   * @param callback - A function to be executed on each logged message of the Logger..
   * @param config - Configuration object
   */
  public watch(
    callback: LoggerWatcherCallback,
    config: WatcherMethodConfigInterface = {}
  ): this {
    config = defineConfig(config, {
      key: generateId(),
      level: 0,
    });
    this.watchers[config.key as any] = {
      callback,
      level: config.level as any,
    };
    return this;
  }

  /**
   * Assigns the specified level to the Logger.
   *
   * The Logger level determines which log types can be logged.
   * By default, the logger supports a number of levels, which are represented in 'Logger.level'.
   *
   * @public
   * @param level - Level
   */
  public setLevel(level: number): this {
    this.config.level = level;
    return this;
  }
}

export type LoggerCategoryKey = string | number;
export type LoggerKey = string | number;

/**
 * @param key - Key/Name of Logger Category
 * @param customStyle - Css Styles that get applied to the Logs
 * @param prefix - Prefix that gets written before each Log of this Category
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
 * @param level - Handles which Logger Categories can be Logged
 * @param timestamp - Timestamp that ges written before each log of this Logger
 */
export interface LoggerConfigInterface {
  prefix: string;
  canUseCustomStyles: boolean;
  level: number;
  timestamp: boolean;
  allowedTags: LoggerKey[];
}

/**
 * @param prefix - Prefix that gets written before each log of this Logger
 * @param allowedTags - Only Logs that, contains the allowed Tags or have no Tag get logged
 * @param canUseCustomStyles - If custom Styles can be applied to the Logs
 * @param active - If Logger is active
 * @param level - Handles which Logger Categories can be Logged
 * @param timestamp - Timestamp that ges written before each log of this Logger
 */
export interface CreateLoggerConfigInterface {
  prefix?: string;
  allowedTags?: LoggerKey[];
  canUseCustomStyles?: boolean;
  active?: boolean;
  level?: number;
  timestamp?: boolean;
}

export type LoggerConfig =
  | CreateLoggerConfigInterface
  | ((logger: Logger) => CreateLoggerConfigInterface);

export type ConsoleLogType =
  | 'log'
  | 'warn'
  | 'error'
  | 'table'
  | 'info'
  | 'debug';

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
  level: number;
}

export interface WatcherMethodConfigInterface {
  key?: string;
  level?: number;
}

export interface DefaultLogMethodsInterface {
  log: (...data: any) => void;
  debug: (...data: any) => void;
  info: (...data: any) => void;
  success: (...data: any) => void;
  warn: (...data: any) => void;
  error: (...data: any) => void;
  table: (...data: any) => void;
}
