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

import {TopicOverloadPolicy} from '../proxy/topic/TopicOverloadPolicy';
import {ClientNetworkConfig} from './ClientNetworkConfig';
import {ConfigPatternMatcher} from './ConfigPatternMatcher';
import {EvictionPolicy} from './EvictionPolicy';
import {FlakeIdGeneratorConfig} from './FlakeIdGeneratorConfig';
import {GroupConfig} from './GroupConfig';
import {ImportConfig} from './ImportConfig';
import {InMemoryFormat} from './InMemoryFormat';
import {ListenerConfig} from './ListenerConfig';
import {NearCacheConfig} from './NearCacheConfig';
import {Properties} from './Properties';
import {ReliableTopicConfig} from './ReliableTopicConfig';
import {SerializationConfig} from './SerializationConfig';

/**
 * Top level configuration object of Hazelcast client. Other configurations items are properties of this object.
 */
export class ClientConfig {

    properties: Properties = {
        'hazelcast.client.heartbeat.interval': 5000,
        'hazelcast.client.heartbeat.timeout': 60000,
        'hazelcast.client.invocation.retry.pause.millis': 1000,
        'hazelcast.client.invocation.timeout.millis': 120000,
        'hazelcast.client.cloud.url': 'https://coordinator.hazelcast.cloud',
        'hazelcast.invalidation.reconciliation.interval.seconds': 60,
        'hazelcast.invalidation.max.tolerated.miss.count': 10,
        'hazelcast.invalidation.min.reconciliation.interval.seconds': 30,
    };

    /**
     * Name of this client instance.
     */
    instanceName: string;
    groupConfig: GroupConfig = new GroupConfig();
    networkConfig: ClientNetworkConfig = new ClientNetworkConfig();
    customCredentials: any = null;
    listeners: ListenerConfig = new ListenerConfig();
    listenerConfigs: ImportConfig[] = [];
    serializationConfig: SerializationConfig = new SerializationConfig();
    reliableTopicConfigs: { [name: string]: ReliableTopicConfig } = {};
    nearCacheConfigs: { [name: string]: NearCacheConfig } = {};
    flakeIdGeneratorConfigs: { [name: string]: FlakeIdGeneratorConfig } = {};

    private configPatternMatcher = new ConfigPatternMatcher();

    getReliableTopicConfig(name: string): ReliableTopicConfig {
        const matching = this.lookupByPattern<ReliableTopicConfig>(this.reliableTopicConfigs, name);
        let config: ReliableTopicConfig;
        if (matching != null) {
            config = matching.clone();
        } else {
            config = new ReliableTopicConfig();
        }
        config.name = name;
        return config;
    }

    getNearCacheConfig(name: string): NearCacheConfig {
        const matching = this.lookupByPattern<NearCacheConfig>(this.nearCacheConfigs, name);
        if (matching == null) {
            return null;
        }
        const config = matching.clone();
        config.name = name;
        return config;
    }

    getFlakeIdGeneratorConfig(name: string): FlakeIdGeneratorConfig {
        const matching: FlakeIdGeneratorConfig = this.lookupByPattern<FlakeIdGeneratorConfig>(this.flakeIdGeneratorConfigs, name);
        let config: FlakeIdGeneratorConfig;
        if (matching != null) {
            config = matching.clone();
        } else {
            config = new FlakeIdGeneratorConfig();
        }
        config.name = name;
        return config;
    }

    private lookupByPattern<T>(config: { [pattern: string]: any }, name: string): T {
        if (config[name] != null) {
            return config[name];
        }
        const matchingPattern = this.configPatternMatcher.matches(Object.keys(config), name);
        if (matchingPattern != null) {
            return config[matchingPattern];
        }
        if (config.default != null) {
            return config.default;
        }
        return null;
    }
}

export {ClientNetworkConfig};

export {TopicOverloadPolicy};

export {SerializationConfig};

export {GroupConfig};

export {ReliableTopicConfig};

export {EvictionPolicy};

export {InMemoryFormat};

export {NearCacheConfig};

export {ImportConfig};

export {FlakeIdGeneratorConfig};
