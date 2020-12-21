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

import { ClientConfig, ClientConfigImpl } from './Config';

/**
 * Config class to configure multiple client configs to be used by single client instance.
 * The client will try to connect them in given order. When the connected cluster fails
 * or the client blacklisted from the cluster via the Management Center, the client will
 * search for alternative clusters with given configs.
 */
export interface ClientFailoverConfig {

    /**
     * Count of attempts to connect to a cluster. For each alternative cluster,
     * the client will try to connect to the cluster respecting related `connectionRetry`.
     *
     * When the client can not connect a cluster, it will try to connect tryCount times going
     * over the alternative client configs in a round-robin fashion. This is triggered at the
     * start and also when the client disconnects from the cluster and can not connect back
     * to it by exhausting attempts described in connectionRetry config. In that case,
     * the client will continue from where it is left off in `clientConfigs` list, and try
     * the next one again in round-robin `tryCount` times.
     *
     * For example, if two alternative clusters are given in the `clientConfigs` list and
     * the tryCount is set as 4, the maximum number of subsequent connection attempts done
     * by the client is 4 x 2 = 8.
     *
     * By default, set to `Number.MAX_SAFE_INTEGER`.
     */
    tryCount?: number;

    /**
     * List of client configs for alternative clusters to be used by the client.
     *
     * The client configurations must be exactly the same except the following configuration options:
     * - `clusterName`
     * - `customCredentials`
     * - `network.clusterMembers`
     * - `network.ssl`
     * - `network.hazelcastCloud`
     */
    clientConfigs?: ClientConfig[];

}

/** @internal */
export class ClientFailoverConfigImpl implements ClientFailoverConfig {

    tryCount = Number.MAX_SAFE_INTEGER;
    clientConfigs: ClientConfigImpl[] = [];

}
