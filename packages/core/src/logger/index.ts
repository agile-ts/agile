import {
  defineConfig,
  includesArray,
  isValidObject,
  generateId,
  isFunction,
} from '../internal';

export class Logger {
  public key?: LoggerKey;

  public isActive: boolean;
  public config: LoggerConfigInterface;
  public allowedTags: string[] = [];
  public loggerCategories: { [key: string]: LoggerCategoryInterface } = {}; // Holds all registered Logger Categories
  public watchers: {
    [key: string]: LoggerWatcherConfigInterface;
  } = {};

  /**
   * @public
   * Logger - Handy Class for handling console.logs
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
    this.allowedTags = _config.allowedTags as any;
    this.config = {
      timestamp: _config.timestamp as any,
      prefix: _config.prefix as any,
      canUseCustomStyles: _config.canUseCustomStyles as any,
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
   * Default Levels of Logger
   */
  static get level() {
    return {
      TRACE: 1,
      DEBUG: 2,
      LOG: 5,
      TABLE: 5,
      INFO: 10,
      SUCCESS: 15,
      WARN: 20,
      ERROR: 50,
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
      key: 'trace',
      prefix: 'Trace',
      level: Logger.level.TRACE,
    });
    this.createLoggerCategory({
      key: 'table',
      level: Logger.level.TABLE,
    });
  }

  //=========================================================================================================
  // Tag
  //=========================================================================================================
  /**
   * @private
   * Only executes following 'command' if all given tags are included in allowedTags
   * @param tags - Tags
   */
  private tag(tags: string[]) {
    if (includesArray(this.allowedTags, tags)) {
      return {
        log: (...data: any[]) => this.log(...data),
        debug: (...data: any[]) => this.debug(...data),
        info: (...data: any[]) => this.info(...data),
        success: (...data: any[]) => this.success(...data),
        warn: (...data: any[]) => this.warn(...data),
        error: (...data: any[]) => this.error(...data),
        trace: (...data: any[]) => this.trace(...data),
        table: (...data: any[]) => this.table(...data),
      };
    }
    return {
      log: () => {
        /* do nothing */
      },
      debug: () => {
        /* do nothing */
      },
      info: () => {
        /* do nothing */
      },
      success: () => {
        /* do nothing */
      },
      warn: () => {
        /* do nothing */
      },
      error: () => {
        /* do nothing */
      },
      trace: () => {
        /* do nothing */
      },
      table: () => {
        /* do nothing */
      },
    };
  }

  public log(...data: any[]) {
    this.invokeConsole(data, 'log', 'log');
  }

  public debug(...data: any[]) {
    this.invokeConsole(
      data,
      'debug',
      typeof console.debug !== 'undefined' ? 'debug' : 'log'
    );
  }

  public info(...data: any[]) {
    this.invokeConsole(
      data,
      'info',
      typeof console.info !== 'undefined' ? 'info' : 'log'
    );
  }

  public success(...data: any[]) {
    this.invokeConsole(data, 'success', 'log');
  }

  public warn(...data: any[]) {
    this.invokeConsole(
      data,
      'warn',
      typeof console.warn !== 'undefined' ? 'warn' : 'log'
    );
  }

  public error(...data: any[]) {
    this.invokeConsole(
      data,
      'error',
      typeof console.error !== 'undefined' ? 'error' : 'log'
    );
  }

  public trace(...data: any[]) {
    this.invokeConsole(
      data,
      'trace',
      typeof console.trace !== 'undefined' ? 'trace' : 'log'
    );
  }

  public table(...data: any[]) {
    this.invokeConsole(
      data,
      'table',
      typeof console.table !== 'undefined' ? 'table' : 'log'
    );
  }

  public custom(loggerCategory: string, ...data: any[]) {
    this.invokeConsole(data, loggerCategory, 'log');
  }

  //=========================================================================================================
  // Invoke Console
  //=========================================================================================================
  /**
   * @internal
   * Logs data in Console
   * @param data - Data
   * @param loggerCategoryKey - Key/Name of Logger Category
   * @param consoleLogType - console[consoleLogProperty]
   */
  private invokeConsole(
    data: any[],
    loggerCategoryKey: LoggerCategoryKey,
    consoleLogType: ConsoleLogType
  ) {
    const loggerCategory = this.getLoggerCategory(loggerCategoryKey);

    // Check if Logger Category is allowed
    if (!this.isActive || loggerCategory.level < this.config.level) return;

    // Build Prefix of Log
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

    // Add built Prefix
    if (typeof data[0] === 'string')
      data[0] = buildPrefix().concat(' ').concat(data[0]);
    else data.unshift(buildPrefix());

    // Call Watcher Callbacks
    for (const key in this.watchers) {
      const watcher = this.watchers[key];
      if (loggerCategory.level >= (watcher.level || 0)) {
        watcher.callback(loggerCategory, data);
      }
    }

    // Init Custom Style
    if (this.config.canUseCustomStyles && loggerCategory.customStyle) {
      const newLogs: any[] = [];
      let hasStyledString = false; // NOTE: Only one style can be used for one String block!
      for (const log of data) {
        if (!hasStyledString && typeof log === 'string') {
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
    if (consoleLogType === 'table') {
      if (typeof data[0] === 'string') {
        console.log(data[0]);
        console.table(data.filter((d) => typeof d !== 'string' && 'number'));
      }
      return;
    }

    // Normal Log
    console[consoleLogType](...data);
  }

  //=========================================================================================================
  // Create Logger Category
  //=========================================================================================================
  /**
   * @public
   * Creates new Logger Category
   * @param loggerCategory - Logger Category
   */
  public createLoggerCategory(loggerCategory: LoggerCategoryInterface) {
    loggerCategory = defineConfig(loggerCategory, {
      prefix: '',
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
   * @return Key of Watcher Function
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
        'Agile: A Watcher Callback Function has to be an function!'
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

  //=========================================================================================================
  // Set Level
  //=========================================================================================================
  /**
   * @public
   * Assigns new Level to Logger
   * NOTE: Default Levels can be found in 'Logger.level.x'
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
  | 'trace'
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
  level?: number;
}
