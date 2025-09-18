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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConnectionRetryConfigImpl = void 0;
/**
 * Connection Retry Config is controls the period among the retries and when should a client gave up
 * retrying. Exponential behaviour can be chosen or jitter can be added to wait periods.
 * @internal
 */
class ConnectionRetryConfigImpl {
    constructor() {
        this.initialBackoffMillis = 1000;
        this.maxBackoffMillis = 30000;
        this.clusterConnectTimeoutMillis = -1;
        this.multiplier = 1.05;
        this.jitter = 0;
    }
}
exports.ConnectionRetryConfigImpl = ConnectionRetryConfigImpl;
//# sourceMappingURL=ConnectionRetryConfig.js.map