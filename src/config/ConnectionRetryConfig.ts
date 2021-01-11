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

/**
 * Connection retry config controls the period among connection establish retries
 * and defines when the client should give up retrying. Supports exponential behaviour
 * with jitter for wait periods.
 */
export interface ConnectionRetryConfig {

    /**
     * Defines wait period in millisecond after the first failure before retrying.
     * Must be non-negative. By default, set to `1000`.
     */
    initialBackoffMillis?: number;

    /**
     * Defines an upper bound for the backoff interval in milliseconds. Must be
     * non-negative. By default, set to `30000` (30 seconds).
     */
    maxBackoffMillis?: number;

    /**
     * Defines timeout value in milliseconds for the client to give up a connection
     * attempt to the cluster. Must be non-negative. By default, set to `120000`
     * (2 minutes).
     */
    clusterConnectTimeoutMillis?: number;

    /**
     * Defines the factor with which to multiply backoff after a failed retry.
     * Must be greater than or equal to `1`. By default, set to `1`.
     */
    multiplier?: number;

    /**
     * Defines how much to randomize backoffs. At each iteration the calculated
     * back-off is randomized via following method in pseudo-code
     * `Random(-jitter * current_backoff, jitter * current_backoff)`.
     * Must be in range `[0.0, 1.0]`. By default, set to `0` (no randomization).
     */
    jitter?: number;

}

/**
 * Connection Retry Config is controls the period among the retries and when should a client gave up
 * retrying. Exponential behaviour can be chosen or jitter can be added to wait periods.
 * @internal
 */
export class ConnectionRetryConfigImpl implements ConnectionRetryConfig {

    initialBackoffMillis = 1000;
    maxBackoffMillis = 30000;
    clusterConnectTimeoutMillis = 120000;
    multiplier = 1;
    jitter = 0;

}
