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

import {ClientCloudConfig} from './ClientCloudConfig';
import {SSLConfig} from './SSLConfig';

/**
 * Network configuration.
 */
export class ClientNetworkConfig {
    /**
     * Array of candidate addresses that client will use to establish initial connection.
     */
    addresses: string[] = [];

    /**
     * hazelcast.cloud configuration to let the client connect the cluster via hazelcast.cloud
     */
    cloudConfig: ClientCloudConfig = new ClientCloudConfig();

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
