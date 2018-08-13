/*
 * Copyright (c) 2008-2018, Hazelcast, Inc. All Rights Reserved.
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

import {DefaultLogger} from './DefaultLogger';
import {NoLogger} from './NoLogger';

export enum LogLevel {
    ERROR = 0,
    WARN = 1,
    INFO = 2,
    DEBUG = 3,
    TRACE = 4,
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
        if (LoggingService.loggingService == null) {
            LoggingService.initialize(null);
        }
        return LoggingService.loggingService;
    }

    static initialize(loggerModule: string | ILogger = null): void {
        if (typeof loggerModule === 'string') {
            if (loggerModule === 'off') {
                LoggingService.loggingService = new LoggingService(new NoLogger());
            } else if (loggerModule === 'default') {
                LoggingService.loggingService = new LoggingService();
            } else {
                throw new RangeError('Logging type unknown: ' + loggerModule);
            }
        } else {
            LoggingService.loggingService = new LoggingService(loggerModule as ILogger);
        }
    }

    log(level: LogLevel, className: string, message: string, furtherInfo: any): void {
        this.logger.log(level, className, message, furtherInfo);
    }

    error(className: string, message: string, furtherInfo: any = null): void {
        this.log(LogLevel.ERROR, className, message, furtherInfo);
    }

    warn(className: string, message: string, furtherInfo: any = null): void {
        this.log(LogLevel.WARN, className, message, furtherInfo);
    }

    info(className: string, message: string, furtherInfo: any = null): void {
        this.log(LogLevel.INFO, className, message, furtherInfo);
    }

    debug(className: string, message: string, furtherInfo: any = null): void {
        this.log(LogLevel.DEBUG, className, message, furtherInfo);
    }

    trace(className: string, message: string, furtherInfo: any = null): void {
        this.log(LogLevel.TRACE, className, message, furtherInfo);
    }
}
