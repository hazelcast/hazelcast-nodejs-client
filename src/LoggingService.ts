import HazelcastClient = require('./HazelcastClient');
import DefaultLogger = require('./DefaultLogger');
export enum LogLevel {
    ERROR = 0,
    WARN = 1,
    INFO = 2,
    DEBUG = 3,
    TRACE = 4
}

export class LoggingService {

    private static loggingService: LoggingService;
    logger: any;

    constructor(externalLogger: string = null) {
        if (externalLogger != null && externalLogger !== '') {
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

    static initialize(loggerModuleName: string = null) {
        LoggingService.loggingService = new LoggingService(loggerModuleName);
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
