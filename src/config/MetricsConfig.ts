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
 * Metrics config. Using this config, you can enable client metrics collection and change the frequency of sending client
 * metrics to the cluster. You can monitor clients using Hazelcast Management Center once the metrics collection is enabled.
 */
export interface MetricsConfig {

    /**
     * Whether the metrics collection should be enabled for the client. It's enabled by default.
     */
    enabled?: boolean;

    /**
     * Frequency of client metrics collection. Must be positive. By default, metrics are collected every 5 seconds.
     */
    collectionFrequencySeconds?: number;
}

/** @internal */
export class MetricsConfigImpl implements MetricsConfig {
    enabled = true;
    collectionFrequencySeconds = 5;
}
