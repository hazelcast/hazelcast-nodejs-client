/**
 * Log level for built-in or custom logger.
 */
export declare enum LogLevel {
    OFF = -1,
    ERROR = 0,
    WARN = 1,
    INFO = 2,
    DEBUG = 3,
    TRACE = 4
}
/**
 * The Hazelcast logging interface.
 */
export interface ILogger {
    /**
     * Logs a message with an associated objectName and furtherInfo at the given level.
     * @param level the log level
     * @param objectName name of the object in which the message is logged
     * @param message the message to log
     * @param furtherInfo further info about the log
     */
    log(level: LogLevel, objectName: string, message: string, furtherInfo: any): void;
    /**
     * Logs a message with an associated objectName and furtherInfo at the error level.
     * @param objectName name of the object in which the message is logged
     * @param message the message to log
     * @param furtherInfo further info about the log
     */
    error(objectName: string, message: string, furtherInfo?: any): void;
    /**
     * Logs a message with an associated objectName and furtherInfo at the warn level.
     * @param objectName name of the object in which the message is logged
     * @param message the message to log
     * @param furtherInfo further info about the log
     */
    warn(objectName: string, message: string, furtherInfo?: any): void;
    /**
     * Logs a message with an associated objectName and furtherInfo at the info level.
     * @param objectName name of the object in which the message is logged
     * @param message the message to log
     * @param furtherInfo further info about the log
     */
    info(objectName: string, message: string, furtherInfo?: any): void;
    /**
     * Logs a message with an associated objectName and furtherInfo at the debug level.
     * @param objectName name of the object in which the message is logged
     * @param message the message to log
     * @param furtherInfo further info about the log
     */
    debug(objectName: string, message: string, furtherInfo?: any): void;
    /**
     * Logs a message with an associated objectName and furtherInfo at the trace level.
     * @param objectName name of the object in which the message is logged
     * @param message the message to log
     * @param furtherInfo further info about the log
     */
    trace(objectName: string, message: string, furtherInfo?: any): void;
}
