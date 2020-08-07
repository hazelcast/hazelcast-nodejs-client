/*
 * Copyright (c) 2008-2020, Hazelcast, Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Log level for built-in or custom logger.
 */
export enum LogLevel {

    OFF = -1,
    ERROR = 0,
    WARN = 1,
    INFO = 2,
    DEBUG = 3,
    TRACE = 4,

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
