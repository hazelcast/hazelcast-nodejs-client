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
exports.DefaultLogger = void 0;
const ILogger_1 = require("./ILogger");
/** @internal */
class DefaultLogger {
    constructor(level) {
        this.level = level;
    }
    log(level, objectName, message, furtherInfo) {
        if (level <= this.level) {
            console.log('[DefaultLogger] %s at %s: %s', ILogger_1.LogLevel[level], objectName, message);
            if (furtherInfo != null) {
                console.log(furtherInfo);
            }
        }
    }
    error(objectName, message, furtherInfo) {
        this.log(ILogger_1.LogLevel.ERROR, objectName, message, furtherInfo);
    }
    warn(objectName, message, furtherInfo) {
        this.log(ILogger_1.LogLevel.WARN, objectName, message, furtherInfo);
    }
    info(objectName, message, furtherInfo) {
        this.log(ILogger_1.LogLevel.INFO, objectName, message, furtherInfo);
    }
    debug(objectName, message, furtherInfo) {
        this.log(ILogger_1.LogLevel.DEBUG, objectName, message, furtherInfo);
    }
    trace(objectName, message, furtherInfo) {
        this.log(ILogger_1.LogLevel.TRACE, objectName, message, furtherInfo);
    }
}
exports.DefaultLogger = DefaultLogger;
//# sourceMappingURL=DefaultLogger.js.map