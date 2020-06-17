/*
 * Copyright (c) 2008-2020, Hazelcast, Inc. All Rights Reserved.
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

import {ClientOfflineError} from '../HazelcastError';
import {ConnectionRetryConfig} from './ConnectionRetryConfig';
import * as HazelcastClient from '../HazelcastClient';

/**
 * Reconnect options.
 */
export enum ReconnectMode {
    /**
     * Prevent reconnect to cluster after a disconnect
     */
    OFF = 'OFF',

    /**
     * Reconnect to cluster by blocking invocations
     */
    ON = 'ON',

    /**
     * Reconnect to cluster without blocking invocations. Invocations will receive
     * {@link ClientOfflineError}
     */
    ASYNC = 'ASYNC',
}

/**
 * Connection strategy configuration is used for setting custom strategies and configuring strategy parameters.
 */
export class ConnectionStrategyConfig {
    /**
     * Set true for non blocking {@link HazelcastClient#newHazelcastClient}. The client creation won't wait to
     * connect to cluster. The client instance will throw exception until it connects to cluster and become ready.
     * If set to false, {@link HazelcastClient#newHazelcastClient} will block until a cluster connection established and it's
     * ready to use client instance
     */
    asyncStart: boolean = false;

    /**
     * How a client reconnect to cluster after a disconnect can be configured. This parameter is used by default strategy and
     * custom implementations may ignore it if configured.
     */
    reconnectMode: ReconnectMode = ReconnectMode.ON;

    /**
     * Connection Retry Config is controls the period among the retries and when should a client gave up
     * retrying. Exponential behaviour can be chosen or jitter can be added to wait periods.
     */
    connectionRetryConfig: ConnectionRetryConfig = new ConnectionRetryConfig();
}
