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

import {ConnectionRetryConfig, ConnectionRetryConfigImpl} from './ConnectionRetryConfig';

/**
 * Reconnect mode.
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
export interface ConnectionStrategyConfig {

    /**
     * Enables non-blocking start mode of {@link HazelcastClient.newHazelcastClient}.
     * When set to `true`, the client creation will not wait to connect to cluster.
     * The client instance will throw exceptions until it connects to cluster and becomes
     * ready. If set to `false`, {@link HazelcastClient.newHazelcastClient} will block
     * until a cluster connection established and it is ready to use the client instance.
     * By default, set to `false`.
     */
    asyncStart?: boolean;

    /**
     * Defines how a client reconnects to cluster after a disconnect. Available values
     * are `ON`, `OFF` and `ASYNC`. By default, set to `ON`.
     */
    reconnectMode?: ReconnectMode;

    /**
     * Connection retry config to be used by the client.
     */
    connectionRetry?: ConnectionRetryConfig;

}

export class ConnectionStrategyConfigImpl implements ConnectionStrategyConfig {

    asyncStart = false;
    reconnectMode: ReconnectMode = ReconnectMode.ON;
    connectionRetry: ConnectionRetryConfigImpl = new ConnectionRetryConfigImpl();

}
