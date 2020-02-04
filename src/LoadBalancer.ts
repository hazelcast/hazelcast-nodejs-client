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

import {ClientConfig, ClientNetworkConfig} from './config/Config';
import {Cluster} from './core/Cluster';
import {Member} from './core/Member';

/**
 * {@link LoadBalancer} allows you to send operations to one of a number of endpoints(Members).
 * It is up to the implementation to use different load balancing policies.
 * <p>
 * If Client is configured with {@link ClientNetworkConfig#smartRouting},
 * only the operations that are not key based will be router to the endpoint returned by the LoadBalancer. If it is
 * not {@link ClientNetworkConfig#smartRouting}, {@link LoadBalancer} will not be used.
 * <p>
 */
export interface LoadBalancer {
    /**
     * Initializes the LoadBalancer.
     *
     * @param cluster the Cluster this LoadBalancer uses to select members from.
     * @param config  the ClientConfig.
     */
    initLoadBalancer(cluster: Cluster, config: ClientConfig): void;

    /**
     * Returns the next member to route to.
     *
     * @return Returns the next member or null if no member is available
     */
    next(): Member;
}
