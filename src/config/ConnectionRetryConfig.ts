/*
 * Copyright (c) 2008-2019, Hazelcast, Inc. All Rights Reserved.
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
 * Connection Retry Config is controls the period among the retries and when should a client gave up
 * retrying. Exponential behaviour can be chosen or jitter can be added to wait periods.
 */
export class ConnectionRetryConfig {
    /**
     * How long to wait after the first failure before retrying
     */
    initialBackoffMillis: number = 1000;

    /**
     * When backoff reaches this upper bound, it does not increase any more.
     */
    maxBackoffMillis: number = 30000;

    /**
     * Timeout value in milliseconds for the client to give up to connect to the current cluster
     */
    clusterConnectTimeoutMillis: number = 20000;

    /**
     * Factor with which to multiply backoff after a failed retry
     */
    multiplier: number = 1;

    /**
     * By how much to randomize backoffs.
     * At each iteration calculated back-off is randomized via following method
     * Math.random(-jitter * current_backoff, jitter * current_backoff)
     */
    jitter: number = 0;
}
