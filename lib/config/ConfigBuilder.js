"use strict";
/*
 * Copyright (c) 2008-2022, Hazelcast, Inc. All Rights Reserved.
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
/** @ignore */ /** */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigBuilder = void 0;
const core_1 = require("../core");
const proxy_1 = require("../proxy");
const Util_1 = require("../util/Util");
const Config_1 = require("./Config");
const EvictionPolicy_1 = require("./EvictionPolicy");
const FlakeIdGeneratorConfig_1 = require("./FlakeIdGeneratorConfig");
const InMemoryFormat_1 = require("./InMemoryFormat");
const NearCacheConfig_1 = require("./NearCacheConfig");
const ReliableTopicConfig_1 = require("./ReliableTopicConfig");
const JsonStringDeserializationPolicy_1 = require("./JsonStringDeserializationPolicy");
const ConnectionStrategyConfig_1 = require("./ConnectionStrategyConfig");
const LoadBalancerConfig_1 = require("./LoadBalancerConfig");
const logging_1 = require("../logging");
const security_1 = require("../security");
const Util = require("../util/Util");
/**
 * Responsible for user-defined config validation. Builds the effective config with necessary defaults.
 * @internal
 */
class ConfigBuilder {
    constructor(config) {
        this.effectiveConfig = new Config_1.ClientConfigImpl();
        this.originalConfig = config || {};
    }
    build() {
        try {
            this.handleConfig(this.originalConfig);
            return this.effectiveConfig;
        }
        catch (err) {
            throw new core_1.InvalidConfigurationError('Config validation error: ' + err.message, err);
        }
    }
    handleConfig(jsonObject) {
        ConfigBuilder.validateSecurityConfiguration(jsonObject);
        for (const key in jsonObject) {
            const value = jsonObject[key];
            if (key === 'clusterName') {
                this.effectiveConfig.clusterName = (0, Util_1.tryGetString)(value);
            }
            else if (key === 'instanceName') {
                this.effectiveConfig.instanceName = (0, Util_1.tryGetString)(value);
            }
            else if (key === 'properties') {
                this.handleProperties(value);
            }
            else if (key === 'clientLabels') {
                this.handleClientLabels(value);
            }
            else if (key === 'network') {
                this.handleNetwork(value);
            }
            else if (key === 'connectionStrategy') {
                this.handleConnectionStrategy(value);
            }
            else if (key === 'lifecycleListeners') {
                this.handleLifecycleListeners(value);
            }
            else if (key === 'membershipListeners') {
                this.handleMembershipListeners(value);
            }
            else if (key === 'serialization') {
                this.handleSerialization(value);
            }
            else if (key === 'nearCaches') {
                this.handleNearCaches(value);
            }
            else if (key === 'reliableTopics') {
                this.handleReliableTopics(value);
            }
            else if (key === 'flakeIdGenerators') {
                this.handleFlakeIdGenerators(value);
            }
            else if (key === 'loadBalancer') {
                this.handleLoadBalancer(value);
            }
            else if (key === 'customLogger') {
                this.handleLogger(value);
            }
            else if (key === 'customCredentials') {
                this.effectiveConfig.customCredentials = value;
            }
            else if (key === 'backupAckToClientEnabled') {
                this.effectiveConfig.backupAckToClientEnabled = (0, Util_1.tryGetBoolean)(value);
            }
            else if (key === 'metrics') {
                this.handleMetrics(value);
            }
            else if (key === 'security') {
                this.handleSecurity(value);
            }
            else {
                throw new RangeError(`Unexpected config key '${key}' is passed to the Hazelcast Client`);
            }
        }
        ConfigBuilder.overrideMetricsViaStatistics(jsonObject, this.effectiveConfig.metrics);
    }
    handleMetrics(jsonObject) {
        for (const key in jsonObject) {
            if (key === 'enabled') {
                this.effectiveConfig.metrics.enabled = (0, Util_1.tryGetBoolean)(jsonObject[key]);
            }
            else if (key === 'collectionFrequencySeconds') {
                const collectionFrequencySeconds = jsonObject[key];
                (0, Util_1.assertPositiveNumber)(collectionFrequencySeconds, 'Metrics collection frequency must be positive!');
                this.effectiveConfig.metrics.collectionFrequencySeconds = collectionFrequencySeconds;
            }
            else {
                throw new RangeError(`Unexpected metrics config '${key}' is passed to the Hazelcast Client`);
            }
        }
    }
    static validateSecurityConfiguration(jsonObject) {
        if ('security' in jsonObject && 'customCredentials' in jsonObject) {
            throw new RangeError('Ambiguous security configuration is found. ' +
                'Use one of \'security\' or \'customCredentials\' elements, not both.');
        }
    }
    handleSecurity(jsonObject) {
        let isCredentialsSet = false;
        for (const key in jsonObject) {
            if (isCredentialsSet) {
                throw new RangeError('Security configuration may only contain one of the supported credential types. ' +
                    'Multiple credential types are passed to the Hazelcast Client.');
            }
            const value = jsonObject[key];
            if (key === 'usernamePassword') {
                this.handleUsernamePasswordCredentials(value);
            }
            else if (key === 'token') {
                this.handleTokenCredentials(value);
            }
            else if (key === 'custom') {
                this.effectiveConfig.security.custom = value;
            }
            else {
                throw new RangeError(`Unexpected security config ${key} is passed to the Hazelcast Client`);
            }
            isCredentialsSet = true;
        }
    }
    handleUsernamePasswordCredentials(jsonObject) {
        let username = null;
        let password = null;
        for (const key in jsonObject) {
            const value = jsonObject[key];
            if (key === 'username') {
                username = (0, Util_1.tryGetStringOrNull)(value);
            }
            else if (key === 'password') {
                password = (0, Util_1.tryGetStringOrNull)(value);
            }
            else {
                throw new RangeError(`Unexpected username password credentials option '${key}' is passed to the Hazelcast Client`);
            }
        }
        this.effectiveConfig.security.usernamePassword = new security_1.UsernamePasswordCredentialsImpl(username, password);
    }
    handleTokenCredentials(jsonObject) {
        let token;
        let encoding;
        for (const key in jsonObject) {
            const value = jsonObject[key];
            if (key === 'token') {
                token = (0, Util_1.tryGetString)(value);
            }
            else if (key === 'encoding') {
                encoding = (0, Util_1.tryGetEnum)(security_1.TokenEncoding, value);
            }
            else {
                throw new RangeError(`Unexpected token credentials option '${key}' is passed to the Hazelcast Client`);
            }
        }
        if (token == null) {
            throw new RangeError('\'token\' option must be provided in token credentials.');
        }
        this.effectiveConfig.security.token = new security_1.TokenCredentialsImpl(token, encoding);
    }
    handleConnectionStrategy(jsonObject) {
        for (const key in jsonObject) {
            const value = jsonObject[key];
            if (key === 'asyncStart') {
                this.effectiveConfig.connectionStrategy.asyncStart = (0, Util_1.tryGetBoolean)(value);
            }
            else if (key === 'reconnectMode') {
                this.effectiveConfig.connectionStrategy.reconnectMode = (0, Util_1.tryGetEnum)(ConnectionStrategyConfig_1.ReconnectMode, value);
            }
            else if (key === 'connectionRetry') {
                this.handleConnectionRetry(value);
            }
            else {
                throw new RangeError(`Unexpected connection strategy config '${key}' is passed to the Hazelcast Client`);
            }
        }
    }
    handleConnectionRetry(jsonObject) {
        for (const key in jsonObject) {
            const value = jsonObject[key];
            if (key === 'initialBackoffMillis') {
                (0, Util_1.assertNonNegativeNumber)(value, 'Initial backoff must be non-negative!');
                this.effectiveConfig.connectionStrategy.connectionRetry.initialBackoffMillis = value;
            }
            else if (key === 'maxBackoffMillis') {
                (0, Util_1.assertNonNegativeNumber)(value, 'Max backoff must be non-negative!');
                this.effectiveConfig.connectionStrategy.connectionRetry.maxBackoffMillis = value;
            }
            else if (key === 'multiplier') {
                if (typeof value !== 'number' || value < 1.0) {
                    throw new RangeError('Multiplier must be a number that is greater than or equal to 1.0!');
                }
                this.effectiveConfig.connectionStrategy.connectionRetry.multiplier = value;
            }
            else if (key === 'clusterConnectTimeoutMillis') {
                if (typeof value !== 'number' || (value < 0 && value !== -1)) {
                    throw new RangeError('ClusterConnectTimeoutMillis can be only non-negative number or -1!');
                }
                this.effectiveConfig.connectionStrategy.connectionRetry.clusterConnectTimeoutMillis = value;
            }
            else if (key === 'jitter') {
                if (typeof value !== 'number' || (value < 0 || value > 1)) {
                    throw new RangeError('Jitter must be a number in range [0.0, 1.0]!');
                }
                this.effectiveConfig.connectionStrategy.connectionRetry.jitter = value;
            }
            else {
                throw new RangeError(`Unexpected connection retry config '${key}' is passed to the Hazelcast Client`);
            }
        }
    }
    handleClientLabels(jsonObject) {
        const labelsArray = (0, Util_1.tryGetArray)(jsonObject);
        for (const index in labelsArray) {
            const label = labelsArray[index];
            this.effectiveConfig.clientLabels.push(label);
        }
    }
    handleNetwork(jsonObject) {
        for (const key in jsonObject) {
            if (key === 'clusterMembers') {
                this.handleClusterMembers(jsonObject[key]);
            }
            else if (key === 'smartRouting') {
                this.effectiveConfig.network.smartRouting = (0, Util_1.tryGetBoolean)(jsonObject[key]);
            }
            else if (key === 'redoOperation') {
                this.effectiveConfig.network.redoOperation = (0, Util_1.tryGetBoolean)(jsonObject[key]);
            }
            else if (key === 'connectionTimeout') {
                this.effectiveConfig.network.connectionTimeout = (0, Util_1.tryGetNumber)(jsonObject[key]);
            }
            else if (key === 'ssl') {
                this.handleSSL(jsonObject[key]);
            }
            else if (key === 'hazelcastCloud') {
                this.handleHazelcastCloud(jsonObject[key]);
            }
            else {
                throw new RangeError(`Unexpected network option '${key}' is passed to the Hazelcast Client`);
            }
        }
    }
    handleHazelcastCloud(jsonObject) {
        for (const key in jsonObject) {
            if (key === 'discoveryToken') {
                this.effectiveConfig.network.hazelcastCloud.discoveryToken = (0, Util_1.tryGetString)(jsonObject[key]);
            }
            else {
                throw new RangeError(`Unexpected hazelcast cloud option '${key}' is passed to the Hazelcast Client`);
            }
        }
    }
    static parseProperties(jsonObject) {
        const props = {};
        for (const key in jsonObject) {
            props[key] = jsonObject[key];
        }
        return props;
    }
    handleSSL(jsonObject) {
        const sslConfigKeys = new Set(Object.keys(this.effectiveConfig.network.ssl));
        for (const key in jsonObject) {
            if (!sslConfigKeys.has(key)) {
                throw new RangeError(`Unexpected ssl option '${key}' is passed to the Hazelcast Client`);
            }
        }
        const sslEnabled = (0, Util_1.tryGetBoolean)(jsonObject.enabled);
        this.effectiveConfig.network.ssl.enabled = sslEnabled;
        if (jsonObject.sslOptions) {
            if (jsonObject.sslOptionsFactory || jsonObject.sslOptionsFactoryProperties) {
                throw new RangeError('Invalid configuration. Either SSL options should be set manually or SSL factory'
                    + ' should be used.');
            }
            this.effectiveConfig.network.ssl.sslOptions = jsonObject.sslOptions;
        }
        else if (jsonObject.sslOptionsFactory || jsonObject.sslOptionsFactoryProperties) {
            this.handleSSLOptionsFactory(jsonObject.sslOptionsFactory);
            const factoryPropsType = typeof jsonObject.sslOptionsFactoryProperties;
            if (factoryPropsType !== 'object') {
                throw new RangeError(`Expected 'sslOptionsFactoryProperties' to be an object but it is a: ${factoryPropsType}`);
            }
            this.effectiveConfig.network.ssl.sslOptionsFactoryProperties = jsonObject.sslOptionsFactoryProperties
                ? ConfigBuilder.parseProperties(jsonObject.sslOptionsFactoryProperties) : null;
        }
    }
    handleSSLOptionsFactory(sslOptionsFactory) {
        if (sslOptionsFactory) {
            if (typeof sslOptionsFactory.init !== 'function') {
                throw new RangeError(`Invalid SSLOptionsFactory is given: ${sslOptionsFactory}. Expected a 'init' property that is a function.`);
            }
            if (typeof sslOptionsFactory.getSSLOptions !== 'function') {
                throw new RangeError(`Invalid SSLOptionsFactory is given: ${sslOptionsFactory}. ` +
                    'Expected a \'getSSLOptions\' property that is a function.');
            }
        }
        this.effectiveConfig.network.ssl.sslOptionsFactory = sslOptionsFactory;
    }
    handleClusterMembers(jsonObject) {
        const addressArray = (0, Util_1.tryGetArray)(jsonObject);
        for (const index in addressArray) {
            const address = addressArray[index];
            this.effectiveConfig.network.clusterMembers.push((0, Util_1.tryGetString)(address));
        }
    }
    static validateProperty(property, value) {
        switch (property) {
            case 'hazelcast.client.heartbeat.interval':
                (0, Util_1.tryGetNumber)(value);
                break;
            case 'hazelcast.client.heartbeat.timeout':
                (0, Util_1.tryGetNumber)(value);
                break;
            case 'hazelcast.client.invocation.retry.pause.millis':
                (0, Util_1.tryGetNumber)(value);
                break;
            case 'hazelcast.client.schema.max.put.retry.count':
                (0, Util_1.tryGetNumber)(value);
                break;
            case 'hazelcast.client.invocation.timeout.millis':
                (0, Util_1.tryGetNumber)(value);
                break;
            case 'hazelcast.client.internal.clean.resources.millis':
                (0, Util_1.tryGetNumber)(value);
                break;
            case 'hazelcast.client.cloud.url':
                (0, Util_1.tryGetString)(value);
                break;
            case 'hazelcast.client.statistics.enabled':
                (0, Util_1.tryGetBoolean)(value);
                break;
            case 'hazelcast.client.statistics.period.seconds':
                (0, Util_1.tryGetNumber)(value);
                break;
            case 'hazelcast.invalidation.reconciliation.interval.seconds':
                (0, Util_1.tryGetNumber)(value);
                break;
            case 'hazelcast.invalidation.max.tolerated.miss.count':
                (0, Util_1.tryGetNumber)(value);
                break;
            case 'hazelcast.invalidation.min.reconciliation.interval.seconds':
                (0, Util_1.tryGetNumber)(value);
                break;
            case 'hazelcast.logging.level':
                (0, Util_1.tryGetEnum)(logging_1.LogLevel, value);
                break;
            case 'hazelcast.client.autopipelining.enabled':
                (0, Util_1.tryGetBoolean)(value);
                break;
            case 'hazelcast.client.autopipelining.threshold.bytes':
                (0, Util_1.tryGetNumber)(value);
                break;
            case 'hazelcast.client.socket.no.delay':
                (0, Util_1.tryGetBoolean)(value);
                break;
            case 'hazelcast.client.shuffle.member.list':
                (0, Util_1.tryGetBoolean)(value);
                break;
            case 'hazelcast.client.operation.backup.timeout.millis':
                (0, Util_1.tryGetNumber)(value);
                break;
            case 'hazelcast.client.operation.fail.on.indeterminate.state':
                (0, Util_1.tryGetBoolean)(value);
                break;
            case 'hazelcast.discovery.public.ip.enabled':
                if (value !== null && typeof value !== 'boolean') {
                    throw new RangeError(`${value} is not null or a boolean.`);
                }
                break;
            default:
                throw new RangeError(`Unexpected property '${property}' is passed to the Hazelcast Client`);
        }
    }
    /**
     * When this method runs, metrics config is already parsed in metricsConfig. This method will override
     * metrics config with statistics config.  There are four different cases:
     *
     * 1. When no config is given metrics will be enabled. Because this is the default behaviour in metrics.
     * 2. When only statistics props is given statistics config will take effect. So backward compatibility is kept.
     * 3. When only metrics config is given metrics config will take effect.
     * 4. When both statistics props and metrics config are given statistics config will take effect.
     *
     * The behaviour is inline with Java client's behaviour.
     */
    static overrideMetricsViaStatistics(config, metricsConfig) {
        if (config.hasOwnProperty('properties') && config.properties.hasOwnProperty('hazelcast.client.statistics.enabled')) {
            metricsConfig.enabled = config.properties['hazelcast.client.statistics.enabled'];
        }
        if (config.hasOwnProperty('properties')
            && config.properties.hasOwnProperty('hazelcast.client.statistics.period.seconds')) {
            metricsConfig.collectionFrequencySeconds = config.properties['hazelcast.client.statistics.period.seconds'];
        }
    }
    handleProperties(jsonObject) {
        if (typeof jsonObject !== 'object') {
            throw new RangeError(`Expected 'properties' to be an object but it is a: ${typeof jsonObject}`);
        }
        for (const key in jsonObject) {
            const value = jsonObject[key];
            try {
                ConfigBuilder.validateProperty(key, value);
            }
            catch (e) {
                throw new RangeError(`Property validation error: Property: ${key}, value: ${value}. Error: ${e}`);
            }
            this.effectiveConfig.properties[key] = value;
        }
    }
    handleLifecycleListeners(jsonObject) {
        const listenersArray = (0, Util_1.tryGetArray)(jsonObject);
        for (const listener of listenersArray) {
            if (typeof listener !== 'function') {
                throw new RangeError(`Lifecycle listener given in 'lifecycleListeners' is not a function, but a: ${typeof listener}`);
            }
            this.effectiveConfig.lifecycleListeners.push(listener);
        }
    }
    handleMembershipListeners(jsonObject) {
        const listenersArray = (0, Util_1.tryGetArray)(jsonObject);
        for (const listener of listenersArray) {
            this.handleMembershipListener(listener);
        }
    }
    handleMembershipListener(membershipListener) {
        // Throw in case both memberAdded and memberRemoved are invalid.
        if (typeof membershipListener.memberAdded !== 'function' && typeof membershipListener.memberRemoved !== 'function') {
            throw new RangeError(`Invalid membershipListener is given in 'membershipListeners': ${membershipListener}. `
                + 'Expected at least one of \'memberAdded\' and \'memberRemoved\' properties to exist and be a'
                + ' function.');
        }
        this.effectiveConfig.membershipListeners.push(membershipListener);
    }
    handleSerialization(jsonObject) {
        for (const key in jsonObject) {
            if (key === 'defaultNumberType') {
                const defaultNumberType = (0, Util_1.tryGetString)(jsonObject[key]).toLowerCase();
                // For checking expected value for defaultNumberType. If get unexpected value, throw RangeError.
                Util.getTypeKeyForDefaultNumberType(defaultNumberType);
                this.effectiveConfig.serialization.defaultNumberType = defaultNumberType;
            }
            else if (key === 'isBigEndian') {
                this.effectiveConfig.serialization.isBigEndian = (0, Util_1.tryGetBoolean)(jsonObject[key]);
            }
            else if (key === 'portableVersion') {
                this.effectiveConfig.serialization.portableVersion = (0, Util_1.tryGetNumber)(jsonObject[key]);
            }
            else if (key === 'dataSerializableFactories') {
                this.handleDataSerializableFactories(jsonObject[key]);
            }
            else if (key === 'portableFactories') {
                this.handlePortableFactories(jsonObject[key]);
            }
            else if (key === 'globalSerializer') {
                this.handleGlobalSerializer(jsonObject[key]);
            }
            else if (key === 'customSerializers') {
                this.handleCustomSerializers(jsonObject[key]);
            }
            else if (key === 'compact') {
                this.handleCompactSerializationConfig(jsonObject[key]);
            }
            else if (key === 'jsonStringDeserializationPolicy') {
                this.effectiveConfig.serialization
                    .jsonStringDeserializationPolicy = (0, Util_1.tryGetEnum)(JsonStringDeserializationPolicy_1.JsonStringDeserializationPolicy, jsonObject[key]);
            }
            else {
                throw new RangeError(`Unexpected serialization config '${key}' is passed to the Hazelcast Client`);
            }
        }
    }
    handleCompactSerializationConfig(compactSerializationConfig) {
        for (const key in compactSerializationConfig) {
            if (key === 'serializers') {
                this.handleCompactSerializers(compactSerializationConfig[key]);
            }
            else {
                throw new RangeError(`Unexpected compact serialization config '${key}' is passed to the Hazelcast Client`);
            }
        }
    }
    handleCompactSerializers(compactSerializers) {
        const serializersArray = (0, Util_1.tryGetArray)(compactSerializers);
        for (const serializer of serializersArray) {
            if (typeof serializer.getClass !== 'function' || typeof serializer.getClass() !== 'function') {
                throw new RangeError(`Invalid compact serializer is given: ${serializer}. Expected a 'getClass' function that returns a function.`);
            }
            if (typeof serializer.getTypeName !== 'function' || typeof serializer.getTypeName() !== 'string') {
                throw new RangeError(`Invalid compact serializer is given: ${serializer}. Expected a 'getTypeName' function that returns a string.`);
            }
            if (typeof serializer.read !== 'function') {
                throw new RangeError(`Invalid compact serializer is given: ${serializer}. Expected a 'read' property that is function.`);
            }
            if (typeof serializer.write !== 'function') {
                throw new RangeError(`Invalid compact serializer is given: ${serializer}. Expected a 'write' property that is function.`);
            }
            this.effectiveConfig.serialization.compact.serializers.push(serializer);
        }
    }
    handleGlobalSerializer(globalSerializer) {
        if (!globalSerializer) {
            throw new RangeError(`Invalid global serializer is given: ${globalSerializer}. Expected a truthy value.`);
        }
        if (typeof globalSerializer.id !== 'number') {
            throw new RangeError(`Invalid global serializer is given: ${globalSerializer}. Expected a 'id' property that is a number.`);
        }
        if (!Number.isInteger(globalSerializer.id) || globalSerializer.id < 1) {
            throw new RangeError(`Invalid global serializer is given: ${globalSerializer}`
                + 'Expected the \'id\' property to be an integer greater or equal to 1.');
        }
        if (typeof globalSerializer.read !== 'function') {
            throw new RangeError(`Invalid global serializer is given: ${globalSerializer}. Expected a 'read' property that is function.`);
        }
        if (typeof globalSerializer.write !== 'function') {
            throw new RangeError(`Invalid global serializer is given: ${globalSerializer}. Expected a 'write' property that is function.`);
        }
        this.effectiveConfig.serialization.globalSerializer = globalSerializer;
    }
    handlePortableFactories(portableFactories) {
        if (typeof portableFactories !== 'object') {
            throw new RangeError(`Expected 'portableFactories' to be an object but it is a: ${typeof portableFactories}`);
        }
        for (const index in portableFactories) {
            const idx = +index;
            if (!Number.isInteger(idx)) {
                throw new RangeError(`'portableFactories' should only include integer keys, given key: ${index}`);
            }
            if (typeof portableFactories[index] !== 'function') {
                throw new RangeError(`Expected the portableFactory to be function but it is not: ${portableFactories[index]}`);
            }
            this.effectiveConfig.serialization.portableFactories[idx] = portableFactories[index];
        }
    }
    handleDataSerializableFactories(dataSerializableFactories) {
        if (typeof dataSerializableFactories !== 'object') {
            throw new RangeError(`Expected 'dataSerializableFactories' to be an object but it is a: ${typeof dataSerializableFactories}`);
        }
        for (const index in dataSerializableFactories) {
            const idx = +index;
            if (!Number.isInteger(idx)) {
                throw new RangeError(`'dataSerializableFactories' should only include integer keys, given key: ${index}`);
            }
            if (typeof dataSerializableFactories[index] !== 'function') {
                throw new RangeError(`Expected the dataSerializableFactory to be function but it is not: ${dataSerializableFactories[index]}`);
            }
            this.effectiveConfig.serialization.dataSerializableFactories[idx] = dataSerializableFactories[index];
        }
    }
    handleCustomSerializers(jsonObject) {
        const serializersArray = (0, Util_1.tryGetArray)(jsonObject);
        for (const serializer of serializersArray) {
            if (typeof serializer.id !== 'number') {
                throw new RangeError(`Invalid custom serializer is given: ${serializer}. Expected a 'id' property that is a number.`);
            }
            if (!Number.isInteger(serializer.id) || serializer.id < 1) {
                throw new RangeError(`Invalid custom serializer is given: ${serializer}`
                    + 'Expected the \'id\' property to be an integer greater or equal to 1.');
            }
            if (typeof serializer.read !== 'function') {
                throw new RangeError(`Invalid custom serializer is given: ${serializer}. Expected a 'read' property that is function.`);
            }
            if (typeof serializer.write !== 'function') {
                throw new RangeError(`Invalid custom serializer is given: ${serializer}. Expected a 'write' property that is function.`);
            }
            this.effectiveConfig.serialization.customSerializers.push(serializer);
        }
    }
    handleNearCaches(jsonObject) {
        if (typeof jsonObject !== 'object') {
            throw new RangeError(`Expected 'nearCaches' to be an object but it is a: ${typeof jsonObject}`);
        }
        for (const name in jsonObject) {
            const ncConfig = jsonObject[name];
            const nearCacheConfig = new NearCacheConfig_1.NearCacheConfigImpl();
            nearCacheConfig.name = name;
            for (const key in ncConfig) {
                if (key === 'invalidateOnChange') {
                    nearCacheConfig.invalidateOnChange = (0, Util_1.tryGetBoolean)(ncConfig[key]);
                }
                else if (key === 'maxIdleSeconds') {
                    nearCacheConfig.maxIdleSeconds = (0, Util_1.tryGetNumber)(ncConfig[key]);
                }
                else if (key === 'inMemoryFormat') {
                    nearCacheConfig.inMemoryFormat = (0, Util_1.tryGetEnum)(InMemoryFormat_1.InMemoryFormat, ncConfig[key]);
                }
                else if (key === 'timeToLiveSeconds') {
                    nearCacheConfig.timeToLiveSeconds = (0, Util_1.tryGetNumber)(ncConfig[key]);
                }
                else if (key === 'evictionPolicy') {
                    nearCacheConfig.evictionPolicy = (0, Util_1.tryGetEnum)(EvictionPolicy_1.EvictionPolicy, ncConfig[key]);
                }
                else if (key === 'evictionMaxSize') {
                    nearCacheConfig.evictionMaxSize = (0, Util_1.tryGetNumber)(ncConfig[key]);
                }
                else if (key === 'evictionSamplingCount') {
                    nearCacheConfig.evictionSamplingCount = (0, Util_1.tryGetNumber)(ncConfig[key]);
                }
                else if (key === 'evictionSamplingPoolSize') {
                    nearCacheConfig.evictionSamplingPoolSize = (0, Util_1.tryGetNumber)(ncConfig[key]);
                }
                else {
                    throw new RangeError(`Unexpected near cache config '${key}' for near cache ${name}`
                        + 'is passed to the Hazelcast Client');
                }
            }
            this.effectiveConfig.nearCaches[nearCacheConfig.name] = nearCacheConfig;
        }
    }
    handleReliableTopics(jsonObject) {
        if (typeof jsonObject !== 'object') {
            throw new RangeError(`Expected 'reliableTopics' to be an object but it is a: ${typeof jsonObject}`);
        }
        for (const name in jsonObject) {
            const jsonRtCfg = jsonObject[name];
            const reliableTopicConfig = new ReliableTopicConfig_1.ReliableTopicConfigImpl();
            reliableTopicConfig.name = name;
            for (const key in jsonRtCfg) {
                if (key === 'readBatchSize') {
                    reliableTopicConfig.readBatchSize = jsonRtCfg[key];
                }
                else if (key === 'overloadPolicy') {
                    reliableTopicConfig.overloadPolicy = (0, Util_1.tryGetEnum)(proxy_1.TopicOverloadPolicy, jsonRtCfg[key]);
                }
                else {
                    throw new RangeError(`Unexpected reliable topic config '${key}' for reliable topic ${name}`
                        + 'is passed to the Hazelcast Client');
                }
            }
            this.effectiveConfig.reliableTopics[reliableTopicConfig.name] = reliableTopicConfig;
        }
    }
    handleFlakeIdGenerators(jsonObject) {
        if (typeof jsonObject !== 'object') {
            throw new RangeError(`Expected 'flakeIdGenerators' to be an object but it is a: ${typeof jsonObject}`);
        }
        for (const name in jsonObject) {
            const fidConfig = jsonObject[name];
            const flakeIdConfig = new FlakeIdGeneratorConfig_1.FlakeIdGeneratorConfigImpl();
            flakeIdConfig.name = name;
            for (const key in fidConfig) {
                if (key === 'prefetchCount') {
                    flakeIdConfig.prefetchCount = (0, Util_1.tryGetNumber)(fidConfig[key]);
                }
                else if (key === 'prefetchValidityMillis') {
                    flakeIdConfig.prefetchValidityMillis = (0, Util_1.tryGetNumber)(fidConfig[key]);
                }
                else {
                    throw new RangeError(`Unexpected flake id generator config '${key}' for flake id generator ${name}`
                        + 'is passed to the Hazelcast Client');
                }
            }
            this.effectiveConfig.flakeIdGenerators[flakeIdConfig.name] = flakeIdConfig;
        }
    }
    handleLoadBalancer(jsonObject) {
        for (const key in jsonObject) {
            if (key === 'type') {
                this.effectiveConfig.loadBalancer.type = (0, Util_1.tryGetEnum)(LoadBalancerConfig_1.LoadBalancerType, jsonObject[key]);
            }
            else if (key === 'customLoadBalancer') {
                this.handleCustomLoadBalancer(jsonObject[key]);
            }
            else {
                throw new RangeError(`Unexpected load balancer config '${key}' is passed to the Hazelcast Client`);
            }
        }
    }
    handleCustomLoadBalancer(customLB) {
        if (!customLB) {
            throw new RangeError(`Invalid LoadBalancer is given: ${customLB}. Expected a truthy value.`);
        }
        if (typeof customLB.initLoadBalancer !== 'function') {
            throw new RangeError(`Invalid LoadBalancer is given: ${customLB}. Expected a 'initLoadBalancer' property to be a function.`);
        }
        if (typeof customLB.next !== 'function') {
            throw new RangeError(`Invalid LoadBalancer is given: ${customLB}. Expected a 'next' property to be a function.`);
        }
        this.effectiveConfig.loadBalancer.customLoadBalancer = customLB;
    }
    handleLogger(customLogger) {
        if (!customLogger) {
            throw new RangeError(`Invalid custom logger is given: ${customLogger}. Expected a truthy value.`);
        }
        const functionProps = ['log', 'error', 'warn', 'info', 'debug', 'trace'];
        for (const functionProp of functionProps) {
            if (typeof customLogger[functionProp] !== 'function') {
                throw new RangeError(`Invalid custom logger is given: ${customLogger}. Expected a '${functionProp}' property that is function.`);
            }
        }
        this.effectiveConfig.customLogger = customLogger;
    }
}
exports.ConfigBuilder = ConfigBuilder;
//# sourceMappingURL=ConfigBuilder.js.map