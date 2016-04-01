import HazelcastClient = require('./HazelcastClient');
import DefaultLogger = require('./DefaultLogger');
import NoLogger = require('./NoLogger');
export enum LogLevel {
    ERROR = 0,
    WARN = 1,
    INFO = 2,
    DEBUG = 3,
    TRACE = 4
}

export interface ILogger {
    log(level: LogLevel, className: string, message: string, furtherInfo: any): void;
}

export class LoggingService {

    private static loggingService: LoggingService;
    logger: ILogger;

    constructor(externalLogger: ILogger = null) {
        if (externalLogger != null) {
            this.logger = externalLogger;
        }
        if (this.logger == null) {
            this.logger = new DefaultLogger();
        }
    }

    static getLoggingService(): LoggingService {
        if (LoggingService.loggingService != null) {
            return LoggingService.loggingService;
        } else {
            throw new Error('LoggingService was not initialized');
        }
    }

    static initialize(loggerModule: string | ILogger = null) {
        if (typeof loggerModule === 'string') {
            if (loggerModule === 'off') {
                LoggingService.loggingService = new LoggingService(new NoLogger());
            } else if (loggerModule === 'default') {
                LoggingService.loggingService = new LoggingService();
            } else {
                throw new Error('Logging type unknown: ' + loggerModule);
            }
        } else {
            LoggingService.loggingService = new LoggingService(<ILogger>loggerModule);
        }
    }

    log(level: LogLevel, className: string, message: string, furtherInfo: any) {
        this.logger.log(level, className, message, furtherInfo);
    }

    error(className: string, message: string, furtherInfo: any = null) {
        this.log(LogLevel.ERROR, className, message, furtherInfo);
    }

    warn(className: string, message: string, furtherInfo: any = null) {
        this.log(LogLevel.WARN, className, message, furtherInfo);
    }

    info(className: string, message: string, furtherInfo: any = null) {
        this.log(LogLevel.INFO, className, message, furtherInfo);
    }

    debug(className: string, message: string, furtherInfo: any = null) {
        this.log(LogLevel.DEBUG, className, message, furtherInfo);
    }

    trace(className: string, message: string, furtherInfo: any = null) {
        this.log(LogLevel.TRACE, className, message, furtherInfo);
    }
}
