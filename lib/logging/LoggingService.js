"use strict";
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
/** @ignore */ /** */
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggingService = void 0;
const DefaultLogger_1 = require("./DefaultLogger");
const ILogger_1 = require("./ILogger");
const Util_1 = require("../util/Util");
/**
 * Validates and constructs a valid logger instance and returns it.
 * @internal
 */
class LoggingService {
    constructor(customLogger, level) {
        if (customLogger == null) {
            const logLevel = (0, Util_1.enumFromString)(ILogger_1.LogLevel, level);
            this.logger = new DefaultLogger_1.DefaultLogger(logLevel);
        }
        else if (this.isLogger(customLogger)) {
            this.logger = customLogger;
        }
        else {
            throw new RangeError('Logger should implement ILogger functions!');
        }
    }
    isLogger(loggingProperty) {
        loggingProperty = loggingProperty;
        return loggingProperty.log !== undefined && loggingProperty.error !== undefined
            && loggingProperty.warn !== undefined && loggingProperty.info !== undefined
            && loggingProperty.debug !== undefined && loggingProperty.trace !== undefined;
    }
    getLogger() {
        return this.logger;
    }
}
exports.LoggingService = LoggingService;
//# sourceMappingURL=LoggingService.js.map