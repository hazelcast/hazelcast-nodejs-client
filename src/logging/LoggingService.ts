/*
 * Copyright (c) 2008-2022, Hazelcast, Inc. All Rights Reserved.
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
/** @ignore *//** */

import {Property} from '../config/Properties';
import {DefaultLogger} from './DefaultLogger';
import {ILogger, LogLevel} from './ILogger';
import {enumFromString} from '../util/Util';

/**
 * Validates and constructs a valid logger instance and returns it.
 * @internal
 */
export class LoggingService {

    private readonly logger: ILogger;

    constructor(customLogger: ILogger, level: string) {
        if (customLogger == null) {
            const logLevel = enumFromString<LogLevel>(LogLevel, level);
            this.logger = new DefaultLogger(logLevel);
        } else if (this.isLogger(customLogger)) {
            this.logger = customLogger;
        } else {
            throw new RangeError('Logger should implement ILogger functions!');
        }
    }

    isLogger(loggingProperty: Property): loggingProperty is ILogger {
        loggingProperty = (loggingProperty as ILogger);
        return loggingProperty.log !== undefined && loggingProperty.error !== undefined
            && loggingProperty.warn !== undefined && loggingProperty.info !== undefined
            && loggingProperty.debug !== undefined && loggingProperty.trace !== undefined;
    }

    getLogger(): ILogger {
        return this.logger;
    }
}
