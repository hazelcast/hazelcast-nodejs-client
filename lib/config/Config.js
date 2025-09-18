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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientConfigImpl = void 0;
const ClientNetworkConfig_1 = require("./ClientNetworkConfig");
const ConfigPatternMatcher_1 = require("./ConfigPatternMatcher");
const FlakeIdGeneratorConfig_1 = require("./FlakeIdGeneratorConfig");
const ReliableTopicConfig_1 = require("./ReliableTopicConfig");
const SerializationConfig_1 = require("./SerializationConfig");
const ConnectionStrategyConfig_1 = require("./ConnectionStrategyConfig");
const LoadBalancerConfig_1 = require("./LoadBalancerConfig");
const MetricsConfig_1 = require("./MetricsConfig");
const SecurityConfig_1 = require("./SecurityConfig");
const Statistics_1 = require("../statistics/Statistics");
/**
 * If you are adding a new property, don't forget to add its validation in `handleProperties`.
 * @internal
 */
const DEFAULT_PROPERTIES = {
    'hazelcast.client.heartbeat.interval': 5000,
    'hazelcast.client.heartbeat.timeout': 60000,
    'hazelcast.client.invocation.retry.pause.millis': 1000,
    'hazelcast.client.schema.max.put.retry.count': 100,
    'hazelcast.client.invocation.timeout.millis': 120000,
    'hazelcast.client.internal.clean.resources.millis': 100,
    'hazelcast.client.cloud.url': 'https://api.cloud.hazelcast.com',
    /**
     * `hazelcast.client.statistics.enabled` and `hazelcast.client.period.seconds` are
     * @deprecated since 5.1
     *
     * use `metrics` client config instead.
     */
    'hazelcast.client.statistics.enabled': false,
    'hazelcast.client.statistics.period.seconds': Statistics_1.Statistics.PERIOD_SECONDS_DEFAULT_VALUE,
    'hazelcast.invalidation.reconciliation.interval.seconds': 60,
    'hazelcast.invalidation.max.tolerated.miss.count': 10,
    'hazelcast.invalidation.min.reconciliation.interval.seconds': 30,
    'hazelcast.logging.level': 'INFO',
    'hazelcast.client.autopipelining.enabled': true,
    'hazelcast.client.autopipelining.threshold.bytes': 65536,
    'hazelcast.client.socket.no.delay': true,
    'hazelcast.client.shuffle.member.list': true,
    'hazelcast.client.operation.backup.timeout.millis': 5000,
    'hazelcast.client.operation.fail.on.indeterminate.state': false,
    // `null` is set as the default value here to use this property
    // as a tri-state boolean (see TranslateAddressProvider)
    'hazelcast.discovery.public.ip.enabled': null,
};
/** @internal */
class ClientConfigImpl {
    constructor() {
        this.properties = { ...DEFAULT_PROPERTIES }; // Create a new object
        this.network = new ClientNetworkConfig_1.ClientNetworkConfigImpl();
        this.customLogger = null;
        this.customCredentials = null;
        this.lifecycleListeners = [];
        this.membershipListeners = [];
        this.serialization = new SerializationConfig_1.SerializationConfigImpl();
        this.reliableTopics = {};
        this.nearCaches = {};
        this.flakeIdGenerators = {};
        this.connectionStrategy = new ConnectionStrategyConfig_1.ConnectionStrategyConfigImpl();
        this.clusterName = 'dev';
        this.clientLabels = [];
        this.loadBalancer = new LoadBalancerConfig_1.LoadBalancerConfigImpl();
        this.backupAckToClientEnabled = true;
        this.metrics = new MetricsConfig_1.MetricsConfigImpl();
        this.security = new SecurityConfig_1.SecurityConfigImpl();
        this.configPatternMatcher = new ConfigPatternMatcher_1.ConfigPatternMatcher();
    }
    getInstanceName() {
        return this.instanceName;
    }
    getReliableTopicConfig(name) {
        const matching = this.lookupByPattern(this.reliableTopics, name);
        let config;
        if (matching != null) {
            config = matching.clone();
        }
        else {
            config = new ReliableTopicConfig_1.ReliableTopicConfigImpl();
        }
        config.name = name;
        return config;
    }
    getNearCacheConfig(name) {
        const matching = this.lookupByPattern(this.nearCaches, name);
        if (matching == null) {
            return null;
        }
        const config = matching.clone();
        config.name = name;
        return config;
    }
    getFlakeIdGeneratorConfig(name) {
        const matching = this.lookupByPattern(this.flakeIdGenerators, name);
        let config;
        if (matching != null) {
            config = matching.clone();
        }
        else {
            config = new FlakeIdGeneratorConfig_1.FlakeIdGeneratorConfigImpl();
        }
        config.name = name;
        return config;
    }
    lookupByPattern(config, name) {
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
exports.ClientConfigImpl = ClientConfigImpl;
//# sourceMappingURL=Config.js.map