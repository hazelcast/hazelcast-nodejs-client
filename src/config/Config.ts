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

import {ClientNetworkConfig, ClientNetworkConfigImpl} from './ClientNetworkConfig';
import {ConfigPatternMatcher} from './ConfigPatternMatcher';
import {FlakeIdGeneratorConfig, FlakeIdGeneratorConfigImpl} from './FlakeIdGeneratorConfig';
import {MembershipListener} from '../core/MembershipListener';
import {LifecycleState} from '../LifecycleService';
import {NearCacheConfig, NearCacheConfigImpl} from './NearCacheConfig';
import {Properties} from './Properties';
import {ReliableTopicConfig, ReliableTopicConfigImpl} from './ReliableTopicConfig';
import {SerializationConfig, SerializationConfigImpl} from './SerializationConfig';
import {ILogger} from '../logging/ILogger';
import {ConnectionStrategyConfig, ConnectionStrategyConfigImpl} from './ConnectionStrategyConfig';
import {LoadBalancerConfig, LoadBalancerConfigImpl} from './LoadBalancerConfig';
import {MetricsConfig, MetricsConfigImpl} from './MetricsConfig';
import {SecurityConfig, SecurityConfigImpl} from './SecurityConfig';

/**
 * Top level configuration object of Hazelcast client.
 * Other configurations items are properties of this object.
 */
export interface ClientConfig {

    /**
     * Name of the cluster to connect to. By default, set to `dev`.
     */
    clusterName?: string;

    /**
     * Name of the client instance. By default, set to `hz.client_${CLIENT_ID}`,
     * where `CLIENT_ID` starts from `0`, and it is incremented by `1`
     * for each new client.
     */
    instanceName?: string;

    /**
     * Labels for the client to be sent to the cluster.
     */
    clientLabels?: string[];

    /**
     * Network config of the client.
     */
    network?: ClientNetworkConfig;

    /**
     * Connection strategy config of the client.
     */
    connectionStrategy?: ConnectionStrategyConfig;

    /**
     * Load balancer config for the client.
     */
    loadBalancer?: LoadBalancerConfig;

    /**
     * Lifecycle listeners to be attached to the client.
     */
    lifecycleListeners?: Array<(state: LifecycleState) => void>;

    /**
     * Membership listeners to be attached to the client.
     */
    membershipListeners?: MembershipListener[];

    /**
     * User-defined serialization config for the client.
     */
    serialization?: SerializationConfig;

    /**
     * Near Cache config for the client.
     *
     * Hazelcast client supports wildcard configuration for Near
     * Caches. Using an asterisk (`*`) character in the name,
     * different instances of Maps can be configured by a single
     * configuration.
     *
     * When you use `default` as the config key, it has a special
     * meaning. Hazelcast client will use that configuration as the
     * default one for all Maps, unless there is a specific
     * configuration for the Map.
     */
    nearCaches?: { [name: string]: NearCacheConfig };

    /**
     * Configs for Reliable Topics.
     *
     * Hazelcast client supports wildcard configuration for Reliable
     * Topics. Using an asterisk (`*`) character in the name,
     * different instances of topics can be configured by a single
     * configuration.
     *
     * When you use `default` as the config key, it has a special
     * meaning. Hazelcast client will use that configuration as the
     * default one for all Reliable Topics, unless there is
     * a specific configuration for the topic.
     */
    reliableTopics?: { [name: string]: ReliableTopicConfig };

    /**
     * Configs for Flake ID Generators.
     *
     * Hazelcast client supports wildcard configuration for Flake
     * ID Generators. Using an asterisk (`*`) character in the name,
     * different instances of generators can be configured by a single
     * configuration.
     *
     * When you use `default` as the config key, it has a special
     * meaning. Hazelcast client will use that configuration as the
     * default one for all Flake ID Generators, unless there is
     * a specific configuration for the generator.
     */
    flakeIdGenerators?: { [name: string]: FlakeIdGeneratorConfig };

    /**
     * Custom logger implementation for the client.
     */
    customLogger?: ILogger;

    /**
     * Custom credentials to be used as a part of authentication on
     * the cluster.
     *
     * @deprecated Since version 5.1. Use {@link security} element instead.
     */
    customCredentials?: any;

    /**
     * Enables the client to get backup acknowledgements directly from
     * the member that backups are applied, which reduces number of hops
     * and increases performance for smart clients.
     *
     * Enabled by default for smart clients. This option has no effect
     * for unisocket clients.
     */
    backupAckToClientEnabled?: boolean;

    /**
     * User-defined properties.
     */
    properties?: Properties;

    /**
     * Metrics config. With this config, you enable collecting the client metrics and sending them to the cluster.
     * After enabling you can monitor the clients that are connected to your Hazelcast cluster,
     * using Hazelcast Management Center.
     */
    metrics?: MetricsConfig;
    /**
     * Contains configuration for the client to use different kinds
     * of credential types during authentication, such as username/password,
     * token, or custom credentials.
     */
    security?: SecurityConfig;

}

/**
 * If you are adding a new property, don't forget to add its validation in `handleProperties`.
 * @internal
 */
const DEFAULT_PROPERTIES: Properties = {
    'hazelcast.client.heartbeat.interval': 5000,
    'hazelcast.client.heartbeat.timeout': 60000,
    'hazelcast.client.invocation.retry.pause.millis': 1000,
    'hazelcast.client.invocation.timeout.millis': 120000,
    'hazelcast.client.internal.clean.resources.millis': 100,
    'hazelcast.client.cloud.url': 'https://coordinator.hazelcast.cloud',
    /**
     * `hazelcast.client.statistics.enabled` and `hazelcast.client.period.seconds` are
     * @deprecated since 5.1
     *
     * use `metrics` client config instead.
     */
    'hazelcast.client.statistics.enabled': false,
    'hazelcast.client.statistics.period.seconds': 3,
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
export class ClientConfigImpl implements ClientConfig {
    properties: Properties = {...DEFAULT_PROPERTIES}; // Create a new object
    instanceName: string;
    network = new ClientNetworkConfigImpl();
    customLogger: ILogger = null;
    customCredentials: any = null;
    lifecycleListeners: Array<(state: LifecycleState) => void> = [];
    membershipListeners: MembershipListener[] = [];
    serialization = new SerializationConfigImpl();
    reliableTopics: { [name: string]: ReliableTopicConfigImpl } = {};
    nearCaches: { [name: string]: NearCacheConfigImpl } = {};
    flakeIdGenerators: { [name: string]: FlakeIdGeneratorConfigImpl } = {};
    connectionStrategy = new ConnectionStrategyConfigImpl();
    clusterName = 'dev';
    clientLabels: string[] = [];
    loadBalancer = new LoadBalancerConfigImpl();
    backupAckToClientEnabled = true;
    metrics = new MetricsConfigImpl();
    security = new SecurityConfigImpl();

    private configPatternMatcher = new ConfigPatternMatcher();

    getInstanceName(): string {
        return this.instanceName;
    }

    getReliableTopicConfig(name: string): ReliableTopicConfigImpl {
        const matching = this.lookupByPattern<ReliableTopicConfigImpl>(this.reliableTopics, name);
        let config: ReliableTopicConfigImpl;
        if (matching != null) {
            config = matching.clone();
        } else {
            config = new ReliableTopicConfigImpl();
        }
        config.name = name;
        return config;
    }

    getNearCacheConfig(name: string): NearCacheConfigImpl {
        const matching = this.lookupByPattern<NearCacheConfigImpl>(this.nearCaches, name);
        if (matching == null) {
            return null;
        }
        const config = matching.clone();
        config.name = name;
        return config;
    }

    getFlakeIdGeneratorConfig(name: string): FlakeIdGeneratorConfigImpl {
        const matching: FlakeIdGeneratorConfigImpl =
            this.lookupByPattern<FlakeIdGeneratorConfigImpl>(this.flakeIdGenerators, name);
        let config: FlakeIdGeneratorConfigImpl;
        if (matching != null) {
            config = matching.clone();
        } else {
            config = new FlakeIdGeneratorConfigImpl();
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
