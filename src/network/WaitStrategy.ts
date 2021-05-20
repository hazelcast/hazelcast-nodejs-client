/*
 * Copyright (c) 2008-2021, Hazelcast, Inc. All Rights Reserved.
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

import {ILogger} from '../logging/ILogger';
import {delayedPromise} from '../util/Util';

/** @internal */
export class WaitStrategy {

    private readonly initialBackoffMillis: number;
    private readonly maxBackoffMillis: number;
    private readonly multiplier: number;
    private readonly jitter: number;
    private readonly clusterConnectTimeoutMillis: number;
    private logger: ILogger;
    private attempt: number;
    private currentBackoffMillis: number;
    private readonly clusterConnectTimeoutText: string; // to pretty print infinite timeout
    private clusterConnectAttemptBegin: number;

    constructor(initialBackoffMillis: number,
                maxBackoffMillis: number,
                multiplier: number,
                clusterConnectTimeoutMillis: number,
                jitter: number,
                logger: ILogger) {
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

    public reset(): void {
        this.attempt = 0;
        this.clusterConnectAttemptBegin = Date.now();
        this.currentBackoffMillis = Math.min(this.maxBackoffMillis, this.initialBackoffMillis);
    }

    public sleep(): Promise<boolean> {
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

        return delayedPromise(actualSleepTime)
            .then(() => {
                const nextCurrentBackoffMillis = Math.round(this.currentBackoffMillis * this.multiplier);
                this.currentBackoffMillis = Math.min(nextCurrentBackoffMillis, this.maxBackoffMillis);
                return true;
            });
    }
}
