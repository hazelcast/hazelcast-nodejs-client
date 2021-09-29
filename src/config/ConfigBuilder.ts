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
/** @ignore *//** */

import {InvalidConfigurationError} from '../core';
import {TopicOverloadPolicy} from '../proxy';
import {
    assertNonNegativeNumber,
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
import {LogLevel} from '../logging';

/**
 * Responsible for user-defined config validation. Builds the effective config with necessary defaults.
 * @internal
 */
export class ConfigBuilder {

    private readonly originalConfig: ClientConfig;
    private effectiveConfig: ClientConfigImpl = new ClientConfigImpl();

    constructor(config?: ClientConfig) {
        this.originalConfig = config || {};
    }

    build(): ClientConfigImpl {
        try {
            this.handleConfig(this.originalConfig);
            return this.effectiveConfig;
        } catch (err) {
            throw new InvalidConfigurationError('Config validation error: ' + err.message, err);
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
            } else if (key === 'backupAckToClientEnabled') {
                this.effectiveConfig.backupAckToClientEnabled = tryGetBoolean(value);
            } else {
                throw new RangeError(`Unexpected config key '${key}' is passed to the Hazelcast Client`);
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
            } else {
                throw new RangeError(`Unexpected connection strategy config '${key}' is passed to the Hazelcast Client`);
            }
        }
    }

    private handleConnectionRetry(jsonObject: any): void {
        for (const key in jsonObject) {
            const value = jsonObject[key];
            if (key === 'initialBackoffMillis') {
                assertNonNegativeNumber(value, 'Initial backoff must be non-negative!');
                this.effectiveConfig.connectionStrategy.connectionRetry.initialBackoffMillis = value;
            } else if (key === 'maxBackoffMillis') {
                assertNonNegativeNumber(value, 'Max backoff must be non-negative!');
                this.effectiveConfig.connectionStrategy.connectionRetry.maxBackoffMillis = value;
            } else if (key === 'multiplier') {
                if (typeof value !== 'number' || value < 1.0) {
                    throw new RangeError('Multiplier must be a number that is greater than or equal to 1.0!');
                }
                this.effectiveConfig.connectionStrategy.connectionRetry.multiplier = value;
            } else if (key === 'clusterConnectTimeoutMillis') {
                if (typeof value !== 'number' || (value < 0 && value !== -1)) {
                    throw new RangeError('ClusterConnectTimeoutMillis can be only non-negative number or -1!');
                }
                this.effectiveConfig.connectionStrategy.connectionRetry.clusterConnectTimeoutMillis = value;
            } else if (key === 'jitter') {
                if (typeof value !== 'number' || (value < 0 || value > 1)) {
                    throw new RangeError('Jitter must be a number in range [0.0, 1.0]!');
                }
                this.effectiveConfig.connectionStrategy.connectionRetry.jitter = value;
            } else {
                throw new RangeError(`Unexpected connection retry config '${key}' is passed to the Hazelcast Client`);
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
            } else if (key === 'redoOperation') {
                this.effectiveConfig.network.redoOperation = tryGetBoolean(jsonObject[key]);
            } else if (key === 'connectionTimeout') {
                this.effectiveConfig.network.connectionTimeout = tryGetNumber(jsonObject[key]);
            } else if (key === 'ssl') {
                this.handleSSL(jsonObject[key]);
            } else if (key === 'hazelcastCloud') {
                this.handleHazelcastCloud(jsonObject[key]);
            } else {
                throw new RangeError(`Unexpected network option '${key}' is passed to the Hazelcast Client`);
            }
        }
    }

    private handleHazelcastCloud(jsonObject: any): void {
        for (const key in jsonObject) {
            if (key === 'discoveryToken') {
                this.effectiveConfig.network.hazelcastCloud.discoveryToken = tryGetString(jsonObject[key]);
            } else {
                throw new RangeError(`Unexpected hazelcast cloud option '${key}' is passed to the Hazelcast Client`);
            }
        }
    }

    private static parseProperties(jsonObject: any): Properties {
        const props: Properties = {} as Properties;
        for (const key in jsonObject) {
            props[key] = jsonObject[key];
        }
        return props;
    }

    private handleSSL(jsonObject: any): void {
        const sslConfigKeys = new Set(Object.keys(this.effectiveConfig.network.ssl));
        for (const key in jsonObject) {
            if (!sslConfigKeys.has(key)) {
                throw new RangeError(`Unexpected ssl option '${key}' is passed to the Hazelcast Client`);
            }
        }
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
                ? ConfigBuilder.parseProperties(jsonObject.sslOptionsFactoryProperties) : null;
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
            let value = jsonObject[key];
            switch (key) {
                case 'hazelcast.client.heartbeat.interval':
                    value = tryGetNumber(value);
                    break;
                case 'hazelcast.client.heartbeat.timeout':
                    value = tryGetNumber(value);
                    break;
                case 'hazelcast.client.invocation.retry.pause.millis':
                    value = tryGetNumber(value);
                    break;
                case 'hazelcast.client.invocation.timeout.millis':
                    value = tryGetNumber(value);
                    break;
                case 'hazelcast.client.internal.clean.resources.millis':
                    value = tryGetNumber(value);
                    break;
                case 'hazelcast.client.cloud.url':
                    value = tryGetString(value);
                    break;
                case 'hazelcast.client.statistics.enabled':
                    value = tryGetBoolean(value);
                    break;
                case 'hazelcast.client.statistics.period.seconds':
                    value = tryGetNumber(value);
                    break;
                case 'hazelcast.invalidation.reconciliation.interval.seconds':
                    value = tryGetNumber(value);
                    break;
                case 'hazelcast.invalidation.max.tolerated.miss.count':
                    value = tryGetNumber(value);
                    break;
                case 'hazelcast.invalidation.min.reconciliation.interval.seconds':
                    value = tryGetNumber(value);
                    break;
                case 'hazelcast.logging.level':
                    tryGetEnum(LogLevel, value);
                    break;
                case 'hazelcast.client.autopipelining.enabled':
                    value = tryGetBoolean(value);
                    break;
                case 'hazelcast.client.autopipelining.threshold.bytes':
                    value = tryGetNumber(value);
                    break;
                case 'hazelcast.client.socket.no.delay':
                    value = tryGetBoolean(value);
                    break;
                case 'hazelcast.client.shuffle.member.list':
                    value = tryGetBoolean(value);
                    break;
                case 'hazelcast.client.operation.backup.timeout.millis':
                    value = tryGetNumber(value);
                    break;
                case 'hazelcast.client.operation.fail.on.indeterminate.state':
                    value = tryGetBoolean(value);
                    break;
                case 'hazelcast.discovery.public.ip.enabled':
                    if (value !== null && typeof value !== 'boolean') {
                        throw ConfigBuilder.toPropValidationError(key, value, `${value} is not null or a boolean.`);
                    }
                    break;
                default:
                    throw ConfigBuilder.toPropValidationError(
                        key, value, `Unexpected property '${key}' is passed to the Hazelcast Client`
                    );
            }

            this.effectiveConfig.properties[key] = value;
        }
    }

    private static toPropValidationError(key: any, value: any, message: string) : RangeError {
        return new RangeError(`Property validation error: Property: ${key}, value: ${value}. Error: ${message}`);
    }

    private handleLifecycleListeners(jsonObject: any): void {
        const listenersArray = tryGetArray(jsonObject);
        for (const listener of listenersArray) {
            this.effectiveConfig.lifecycleListeners.push(listener);
        }
    }

    private handleMembershipListeners(jsonObject: any): void {
        const listenersArray = tryGetArray(jsonObject);
        for (const listener of listenersArray) {
            this.effectiveConfig.membershipListeners.push(listener);
        }
    }

    private handleSerialization(jsonObject: any): void {
        for (const key in jsonObject) {
            if (key === 'defaultNumberType') {
                this.effectiveConfig.serialization.defaultNumberType = tryGetString(jsonObject[key]).toLowerCase();
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
            } else {
                throw new RangeError(`Unexpected serialization config '${key}' is passed to the Hazelcast Client`);
            }
        }
    }

    private handleCustomSerializers(jsonObject: any): void {
        const serializersArray = tryGetArray(jsonObject);
        for (const serializer of serializersArray) {
            this.effectiveConfig.serialization.customSerializers.push(serializer);
        }
    }

    private handleNearCaches(jsonObject: any): void {
        for (const name in jsonObject) {
            const ncConfig = jsonObject[name];
            const nearCacheConfig = new NearCacheConfigImpl();
            nearCacheConfig.name = name;
            for (const key in ncConfig) {
                if (key === 'invalidateOnChange') {
                    nearCacheConfig.invalidateOnChange = tryGetBoolean(ncConfig[key]);
                } else if (key === 'maxIdleSeconds') {
                    nearCacheConfig.maxIdleSeconds = tryGetNumber(ncConfig[key]);
                } else if (key === 'inMemoryFormat') {
                    nearCacheConfig.inMemoryFormat = tryGetEnum(InMemoryFormat, ncConfig[key]);
                } else if (key === 'timeToLiveSeconds') {
                    nearCacheConfig.timeToLiveSeconds = tryGetNumber(ncConfig[key]);
                } else if (key === 'evictionPolicy') {
                    nearCacheConfig.evictionPolicy = tryGetEnum(EvictionPolicy, ncConfig[key]);
                } else if (key === 'evictionMaxSize') {
                    nearCacheConfig.evictionMaxSize = tryGetNumber(ncConfig[key]);
                } else if (key === 'evictionSamplingCount') {
                    nearCacheConfig.evictionSamplingCount = tryGetNumber(ncConfig[key]);
                } else if (key === 'evictionSamplingPoolSize') {
                    nearCacheConfig.evictionSamplingPoolSize = tryGetNumber(ncConfig[key]);
                } else {
                    throw new RangeError(`Unexpected near cache config '${key}' for near cache ${name}`
                              + 'is passed to the Hazelcast Client');
                }
            }
            this.effectiveConfig.nearCaches[nearCacheConfig.name] = nearCacheConfig;
        }
    }

    private handleReliableTopics(jsonObject: any): void {
        for (const name in jsonObject) {
            const jsonRtCfg = jsonObject[name];
            const reliableTopicConfig = new ReliableTopicConfigImpl();
            reliableTopicConfig.name = name;
            for (const key in jsonRtCfg) {
                if (key === 'readBatchSize') {
                    reliableTopicConfig.readBatchSize = jsonRtCfg[key];
                } else if (key === 'overloadPolicy') {
                    reliableTopicConfig.overloadPolicy = tryGetEnum(TopicOverloadPolicy, jsonRtCfg[key]);
                } else {
                    throw new RangeError(`Unexpected reliable topic config '${key}' for reliable topic ${name}`
                        + 'is passed to the Hazelcast Client');
                }
            }
            this.effectiveConfig.reliableTopics[reliableTopicConfig.name] = reliableTopicConfig;
        }
    }

    private handleFlakeIdGenerators(jsonObject: any): void {
        for (const name in jsonObject) {
            const fidConfig = jsonObject[name];
            const flakeIdConfig = new FlakeIdGeneratorConfigImpl();
            flakeIdConfig.name = name;
            for (const key in fidConfig) {
                if (key === 'prefetchCount') {
                    flakeIdConfig.prefetchCount = tryGetNumber(fidConfig[key]);
                } else if (key === 'prefetchValidityMillis') {
                    flakeIdConfig.prefetchValidityMillis = tryGetNumber(fidConfig[key]);
                } else {
                    throw new RangeError(`Unexpected flake id generator config '${key}' for flake id generator ${name}`
                        + 'is passed to the Hazelcast Client');
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
            } else {
                throw new RangeError(`Unexpected load balancer config '${key}' is passed to the Hazelcast Client`);
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
