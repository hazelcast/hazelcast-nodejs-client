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
/** @ignore *//** */

import {HazelcastError} from '../core';
import {TopicOverloadPolicy} from '../proxy';
import {
    tryGetArray,
    tryGetBoolean,
    tryGetEnum,
    tryGetNumber,
    tryGetString
} from '../util/Util';
import {ClientConfig, ClientConfigImpl} from './Config';
import {EvictionPolicy} from './EvictionPolicy';
import {FlakeIdGeneratorConfigImpl} from './FlakeIdGeneratorConfig';
import {InMemoryFormat} from './InMemoryFormat';
import {NearCacheConfigImpl} from './NearCacheConfig';
import {Properties} from './Properties';
import {ReliableTopicConfigImpl} from './ReliableTopicConfig';
import {JsonStringDeserializationPolicy} from './JsonStringDeserializationPolicy';
import {ReconnectMode} from './ConnectionStrategyConfig';
import {LoadBalancerType} from './LoadBalancerConfig';

/**
 * Responsible for user-defined config validation. Builds the effective config with necessary defaults.
 * @internal
 */
export class ConfigBuilder {

    private originalConfig: ClientConfig;
    private effectiveConfig: ClientConfigImpl = new ClientConfigImpl();

    constructor(config?: ClientConfig) {
        this.originalConfig = config || {};
    }

    build(): ClientConfigImpl {
        try {
            this.handleConfig(this.originalConfig);
            return this.effectiveConfig;
        } catch (e) {
            throw new HazelcastError('Config validation error: ' + e.message, e);
        }
    }

    private handleConfig(jsonObject: any): void {
        for (const key in jsonObject) {
            const value = jsonObject[key];
            if (key === 'clusterName') {
                this.effectiveConfig.clusterName = tryGetString(value);
            } else if (key === 'instanceName') {
                this.effectiveConfig.instanceName = tryGetString(value);
            } else if (key === 'properties') {
                this.handleProperties(value);
            } else if (key === 'clientLabels') {
                this.handleClientLabels(value);
            } else if (key === 'network') {
                this.handleNetwork(value);
            } else if (key === 'connectionStrategy') {
                this.handleConnectionStrategy(value);
            } else if (key === 'lifecycleListeners') {
                this.handleLifecycleListeners(value);
            } else if (key === 'membershipListeners') {
                this.handleMembershipListeners(value);
            } else if (key === 'serialization') {
                this.handleSerialization(value);
            } else if (key === 'nearCaches') {
                this.handleNearCaches(value);
            } else if (key === 'reliableTopics') {
                this.handleReliableTopics(value);
            } else if (key === 'flakeIdGenerators') {
                this.handleFlakeIdGenerators(value);
            } else if (key === 'loadBalancer') {
                this.handleLoadBalancer(value);
            } else if (key === 'customLogger') {
                this.handleLogger(value);
            } else if (key === 'customCredentials') {
                this.handleCredentials(value);
            }
        }
    }

    private handleConnectionStrategy(jsonObject: any): void {
        for (const key in jsonObject) {
            const value = jsonObject[key];
            if (key === 'asyncStart') {
                this.effectiveConfig.connectionStrategy.asyncStart = tryGetBoolean(value);
            } else if (key === 'reconnectMode') {
                this.effectiveConfig.connectionStrategy.reconnectMode = tryGetEnum(ReconnectMode, value);
            } else if (key === 'connectionRetry') {
                this.handleConnectionRetry(value);
            }
        }
    }

    private handleConnectionRetry(jsonObject: any): void {
        for (const key in jsonObject) {
            const value = jsonObject[key];
            if (key === 'initialBackoffMillis') {
                this.effectiveConfig.connectionStrategy.connectionRetry.initialBackoffMillis = tryGetNumber(value);
            } else if (key === 'maxBackoffMillis') {
                this.effectiveConfig.connectionStrategy.connectionRetry.maxBackoffMillis = tryGetNumber(value);
            } else if (key === 'multiplier') {
                this.effectiveConfig.connectionStrategy.connectionRetry.multiplier = tryGetNumber(value);
            } else if (key === 'clusterConnectTimeoutMillis') {
                this.effectiveConfig.connectionStrategy.connectionRetry
                    .clusterConnectTimeoutMillis = tryGetNumber(value);
            } else if (key === 'jitter') {
                this.effectiveConfig.connectionStrategy.connectionRetry.jitter = tryGetNumber(value);
            }
        }
    }

    private handleClientLabels(jsonObject: any): void {
        const labelsArray = tryGetArray(jsonObject);
        for (const index in labelsArray) {
            const label = labelsArray[index];
            this.effectiveConfig.clientLabels.push(label);
        }
    }

    private handleNetwork(jsonObject: any): void {
        for (const key in jsonObject) {
            if (key === 'clusterMembers') {
                this.handleClusterMembers(jsonObject[key]);
            } else if (key === 'smartRouting') {
                this.effectiveConfig.network.smartRouting = tryGetBoolean(jsonObject[key]);
            } else if (key === 'connectionTimeout') {
                this.effectiveConfig.network.connectionTimeout = tryGetNumber(jsonObject[key]);
            } else if (key === 'ssl') {
                this.handleSSL(jsonObject[key]);
            } else if (key === 'hazelcastCloud') {
                this.handleHazelcastCloud(jsonObject[key]);
            }
        }
    }

    private handleHazelcastCloud(jsonObject: any): void {
        for (const key in jsonObject) {
            if (key === 'discoveryToken') {
                this.effectiveConfig.network.hazelcastCloud.discoveryToken = tryGetString(jsonObject[key]);
            }
        }
    }

    private parseProperties(jsonObject: any): Properties {
        const props: Properties = {} as Properties;
        for (const key in jsonObject) {
            props[key] = jsonObject[key];
        }
        return props;
    }

    private handleSSL(jsonObject: any): void {
        const sslEnabled = tryGetBoolean(jsonObject.enabled);
        this.effectiveConfig.network.ssl.enabled = sslEnabled;

        if (jsonObject.sslOptions) {
            if (jsonObject.sslOptionsFactory || jsonObject.sslOptionsFactoryProperties) {
                throw new RangeError('Invalid configuration. Either SSL options should be set manually or SSL factory'
                    + ' should be used.');
            }
            this.effectiveConfig.network.ssl.sslOptions = jsonObject.sslOptions;
        } else if (jsonObject.sslOptionsFactory || jsonObject.sslOptionsFactoryProperties) {
            this.effectiveConfig.network.ssl.sslOptionsFactory = jsonObject.sslOptionsFactory;
            this.effectiveConfig.network.ssl.sslOptionsFactoryProperties = jsonObject.sslOptionsFactoryProperties
                ? this.parseProperties(jsonObject.sslOptionsFactoryProperties) : null;
        }
    }

    private handleClusterMembers(jsonObject: any): void {
        const addressArray = tryGetArray(jsonObject);
        for (const index in addressArray) {
            const address = addressArray[index];
            this.effectiveConfig.network.clusterMembers.push(tryGetString(address));
        }
    }

    private handleProperties(jsonObject: any): void {
        for (const key in jsonObject) {
            this.effectiveConfig.properties[key] = jsonObject[key];
        }
    }

    private handleLifecycleListeners(jsonObject: any): void {
        const listenersArray = tryGetArray(jsonObject);
        for (const index in listenersArray) {
            const listener = listenersArray[index];
            this.effectiveConfig.lifecycleListeners.push(listener);
        }
    }

    private handleMembershipListeners(jsonObject: any): void {
        const listenersArray = tryGetArray(jsonObject);
        for (const index in listenersArray) {
            const listener = listenersArray[index];
            this.effectiveConfig.membershipListeners.push(listener);
        }
    }

    private handleSerialization(jsonObject: any): void {
        for (const key in jsonObject) {
            if (key === 'defaultNumberType') {
                this.effectiveConfig.serialization.defaultNumberType = tryGetString(jsonObject[key]);
            } else if (key === 'isBigEndian') {
                this.effectiveConfig.serialization.isBigEndian = tryGetBoolean(jsonObject[key]);
            } else if (key === 'portableVersion') {
                this.effectiveConfig.serialization.portableVersion = tryGetNumber(jsonObject[key]);
            } else if (key === 'dataSerializableFactories') {
                for (const index in jsonObject[key]) {
                    const idx = Number.parseInt(index);
                    this.effectiveConfig.serialization
                        .dataSerializableFactories[idx] = jsonObject[key][index];
                }
            } else if (key === 'portableFactories') {
                for (const index in jsonObject[key]) {
                    const idx = Number.parseInt(index);
                    this.effectiveConfig.serialization
                        .portableFactories[idx] = jsonObject[key][index];
                }
            } else if (key === 'globalSerializer') {
                const globalSerializer = jsonObject[key];
                this.effectiveConfig.serialization.globalSerializer = globalSerializer;
            } else if (key === 'customSerializers') {
                this.handleCustomSerializers(jsonObject[key]);
            } else if (key === 'jsonStringDeserializationPolicy') {
                this.effectiveConfig.serialization
                    .jsonStringDeserializationPolicy = tryGetEnum(JsonStringDeserializationPolicy, jsonObject[key]);
            }
        }
    }

    private handleCustomSerializers(jsonObject: any): void {
        const serializersArray = tryGetArray(jsonObject);
        for (const index in serializersArray) {
            const serializer = serializersArray[index];
            this.effectiveConfig.serialization.customSerializers.push(serializer);
        }
    }

    private handleNearCaches(jsonObject: any): void {
        for (const key in jsonObject) {
            const ncConfig = jsonObject[key];
            const nearCacheConfig = new NearCacheConfigImpl();
            nearCacheConfig.name = key;
            for (const name in ncConfig) {
                if (name === 'invalidateOnChange') {
                    nearCacheConfig.invalidateOnChange = tryGetBoolean(ncConfig[name]);
                } else if (name === 'maxIdleSeconds') {
                    nearCacheConfig.maxIdleSeconds = tryGetNumber(ncConfig[name]);
                } else if (name === 'inMemoryFormat') {
                    nearCacheConfig.inMemoryFormat = tryGetEnum(InMemoryFormat, ncConfig[name]);
                } else if (name === 'timeToLiveSeconds') {
                    nearCacheConfig.timeToLiveSeconds = tryGetNumber(ncConfig[name]);
                } else if (name === 'evictionPolicy') {
                    nearCacheConfig.evictionPolicy = tryGetEnum(EvictionPolicy, ncConfig[name]);
                } else if (name === 'evictionMaxSize') {
                    nearCacheConfig.evictionMaxSize = tryGetNumber(ncConfig[name]);
                } else if (name === 'evictionSamplingCount') {
                    nearCacheConfig.evictionSamplingCount = tryGetNumber(ncConfig[name]);
                } else if (name === 'evictionSamplingPoolSize') {
                    nearCacheConfig.evictionSamplingPoolSize = tryGetNumber(ncConfig[name]);
                }
            }
            this.effectiveConfig.nearCaches[nearCacheConfig.name] = nearCacheConfig;
        }
    }

    private handleReliableTopics(jsonObject: any): void {
        for (const key in jsonObject) {
            const jsonRtCfg = jsonObject[key];
            const reliableTopicConfig = new ReliableTopicConfigImpl();
            reliableTopicConfig.name = key;
            for (const name in jsonRtCfg) {
                if (name === 'readBatchSize') {
                    reliableTopicConfig.readBatchSize = jsonRtCfg[name];
                } else if (name === 'overloadPolicy') {
                    reliableTopicConfig.overloadPolicy = tryGetEnum(TopicOverloadPolicy, jsonRtCfg[name]);
                }
            }
            this.effectiveConfig.reliableTopics[reliableTopicConfig.name] = reliableTopicConfig;
        }
    }

    private handleFlakeIdGenerators(jsonObject: any): void {
        for (const key in jsonObject) {
            const fidConfig = jsonObject[key];
            const flakeIdConfig = new FlakeIdGeneratorConfigImpl();
            flakeIdConfig.name = key;
            for (const name in fidConfig) {
                if (name === 'prefetchCount') {
                    flakeIdConfig.prefetchCount = tryGetNumber(fidConfig[name]);
                } else if (name === 'prefetchValidityMillis') {
                    flakeIdConfig.prefetchValidityMillis = tryGetNumber(fidConfig[name]);
                }
            }
            this.effectiveConfig.flakeIdGenerators[flakeIdConfig.name] = flakeIdConfig;
        }
    }

    private handleLoadBalancer(jsonObject: any): void {
        for (const key in jsonObject) {
            if (key === 'type') {
                this.effectiveConfig.loadBalancer.type = tryGetEnum(LoadBalancerType, jsonObject[key]);
            } else if (key === 'customLoadBalancer') {
                this.effectiveConfig.loadBalancer.customLoadBalancer = jsonObject[key];
            }
        }
    }

    private handleLogger(jsonObject: any): void {
        this.effectiveConfig.customLogger = jsonObject;
    }

    private handleCredentials(jsonObject: any): void {
        this.effectiveConfig.customCredentials = jsonObject;
    }
}
