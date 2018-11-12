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

import {ClientCloudConfig} from './ClientCloudConfig';
import {SSLConfig} from './SSLConfig';

/**
 * Network configuration.
 */
export class ClientNetworkConfig {
    /**
     * Client tries to connect the members at these addresses.
     */
    addresses: string[] = [];

    /**
     * hazelcast.cloud configuration to let the client connect the cluster via hazelcast.cloud
     */
    cloudConfig: ClientCloudConfig = new ClientCloudConfig();

    /**
     * While client is trying to connect initially to one of the members in the {@link addresses},
     * all might be not available. Instead of giving up, throwing Exception and stopping client, it will
     * attempt to retry as much as {@link connectionAttemptLimit} times.
     */
    connectionAttemptLimit: number = 2;
    /**
     * Period for the next attempt to find a member to connect.
     */
    connectionAttemptPeriod: number = 3000;
    /**
     * Timeout value in millis for nodes to accept client connection requests.
     */
    connectionTimeout: number = 5000;
    /**
     * true if redo operations are enabled (not implemented yet)
     */
    redoOperation: boolean = false;
    /**
     * If true, client will behave as smart client instead of dummy client. Smart client sends key based operations
     * to owner of the keys. Dummy client sends all operations to a single node. See http://docs.hazelcast.org to
     * learn about smart/dummy client.
     */
    smartRouting: boolean = true;

    /**
     * SSL configuration.
     */
    sslConfig: SSLConfig = new SSLConfig();
}
