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

import {LoadBalancer} from '../LoadBalancer';

/**
 * Defines {@link LoadBalancer} type used by the client.
 */
export enum LoadBalancerType {

    /**
     * This type of load balancer picks the next member randomly.
     */
    RANDOM = 'RANDOM',

    /**
     * This type of load balancer picks each cluster member in turn.
     */
    ROUND_ROBIN = 'ROUND_ROBIN',

}

/**
 * Connection strategy configuration is used for setting custom strategies and configuring strategy parameters.
 */
export interface LoadBalancerConfig {

    /**
     * Defines {@link LoadBalancer} used by the client. Available values
     * are `RANDOM` and `ROUND_ROBIN`. By default, set to `ROUND_ROBIN`.
     */
    type?: LoadBalancerType;

    /**
     * Custom load balancer implementation for the client. When this option is in use,
     * `type` option is ignored.
     */
    customLoadBalancer?: LoadBalancer;

}

/** @internal */
export class LoadBalancerConfigImpl implements LoadBalancerConfig {

    type = LoadBalancerType.ROUND_ROBIN;
    customLoadBalancer: LoadBalancer = null;

}
