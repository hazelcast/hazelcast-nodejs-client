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

import {ClientCloudConfig, ClientCloudConfigImpl} from './ClientCloudConfig';
import {SSLConfig, SSLConfigImpl} from './SSLConfig';

/**
 * Network configuration.
 */
export interface ClientNetworkConfig {

    /**
     * Array of member candidate addresses that client will use to establish initial connection.
     * By default, set to `['127.0.0.1']`.
     */
    clusterMembers?: string[];

    /**
     * Hazelcast Cloud configuration to let the client connect the cluster in cloud.
     */
    hazelcastCloud?: ClientCloudConfig;

    /**
     * Timeout value in milliseconds for nodes to accept client connection requests.
     * By default, set to `5000`.
     */
    connectionTimeout: number;

    // TODO not implemented yet
    /**
     * Enables redo operations behavior.
     */
    redoOperation?: boolean;

    /**
     * Enables smart mode for the client instead of unisocket client. Smart clients
     * send key based operations to owner of the keys. Unisocket clients send all
     * operations to a single node. By default, set to `true`.
     */
    smartRouting?: boolean;

    /**
     * SSL configuration.
     */
    ssl?: SSLConfig;

}

export class ClientNetworkConfigImpl implements ClientNetworkConfig {

    clusterMembers: string[] = [];
    hazelcastCloud: ClientCloudConfigImpl = new ClientCloudConfigImpl();
    connectionTimeout = 5000;
    redoOperation = false;
    smartRouting = true;
    ssl: SSLConfigImpl = new SSLConfigImpl();

}
