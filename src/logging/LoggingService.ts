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

import {NoLogger} from './NoLogger';
import {Property} from '../config/Properties';
import {DefaultLogger} from './DefaultLogger';
import {ILogger} from './ILogger';

export enum LogLevel {
    ERROR = 0,
    WARN = 1,
    INFO = 2,
    DEBUG = 3,
    TRACE = 4,
}

export class LoggingService {

    private readonly logger: ILogger;

    constructor(loggingProperty: Property, logLevel: number) {
        if (loggingProperty === 'off') {
            this.logger = new NoLogger();
        } else if (loggingProperty === 'default') {
            this.logger = new DefaultLogger(logLevel);
        } else if (this.isLogger(loggingProperty)) {
            this.logger = loggingProperty;
        } else {
            throw new RangeError('Logging type unknown: ' + loggingProperty);
        }
    }

    isLogger(loggingProperty: Property): loggingProperty is ILogger {
        return (loggingProperty as ILogger).log !== undefined;
    }

    getLogger(): ILogger {
        return this.logger;
    }
}
