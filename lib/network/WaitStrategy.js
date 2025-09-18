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
exports.WaitStrategy = void 0;
const Util_1 = require("../util/Util");
/** @internal */
class WaitStrategy {
    constructor(initialBackoffMillis, maxBackoffMillis, multiplier, clusterConnectTimeoutMillis, jitter, logger) {
        this.initialBackoffMillis = initialBackoffMillis;
        this.maxBackoffMillis = maxBackoffMillis;
        this.multiplier = multiplier;
        this.clusterConnectTimeoutMillis = clusterConnectTimeoutMillis === -1 ?
            Number.MAX_SAFE_INTEGER : clusterConnectTimeoutMillis;
        // For a better logging output for the default value, we will
        // replace "Number.MAX_SAFE_INTEGER ms" with INFINITE in the output.
        this.clusterConnectTimeoutText = clusterConnectTimeoutMillis === -1 ?
            'INFINITE' : `${clusterConnectTimeoutMillis} ms`;
        this.jitter = jitter;
        this.logger = logger;
    }
    reset() {
        this.attempt = 0;
        this.clusterConnectAttemptBegin = Date.now();
        this.currentBackoffMillis = Math.min(this.maxBackoffMillis, this.initialBackoffMillis);
    }
    sleep() {
        this.attempt++;
        const currentTimeMillis = Date.now();
        const timePassed = currentTimeMillis - this.clusterConnectAttemptBegin;
        if (timePassed > this.clusterConnectTimeoutMillis) {
            this.logger.warn('WaitStrategy', 'Unable to get live cluster connection, cluster connect timeout (' +
                `${this.clusterConnectTimeoutText}) is reached. Attempt ${this.attempt}`);
            return Promise.resolve(false);
        }
        // random_between
        // Random(-jitter * current_backoff, jitter * current_backoff)
        let actualSleepTime = this.currentBackoffMillis
            + this.currentBackoffMillis * this.jitter * (2.0 * Math.random() - 1.0);
        actualSleepTime = Math.min(actualSleepTime, this.clusterConnectTimeoutMillis - timePassed);
        this.logger.warn('WaitStrategy', 'Unable to get live cluster connection, retry in ' +
            `${actualSleepTime} ms, attempt: ${this.attempt}, cluster connect timeout: ` +
            `${this.clusterConnectTimeoutText}, max backoff millis: ${this.maxBackoffMillis}`);
        return (0, Util_1.delayedPromise)(actualSleepTime)
            .then(() => {
            const nextCurrentBackoffMillis = Math.round(this.currentBackoffMillis * this.multiplier);
            this.currentBackoffMillis = Math.min(nextCurrentBackoffMillis, this.maxBackoffMillis);
            return true;
        });
    }
}
exports.WaitStrategy = WaitStrategy;
//# sourceMappingURL=WaitStrategy.js.map