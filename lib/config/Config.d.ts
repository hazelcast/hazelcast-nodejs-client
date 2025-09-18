import { ClientNetworkConfig } from './ClientNetworkConfig';
import { FlakeIdGeneratorConfig } from './FlakeIdGeneratorConfig';
import { MembershipListener } from '../core/MembershipListener';
import { LifecycleState } from '../LifecycleService';
import { NearCacheConfig } from './NearCacheConfig';
import { Properties } from './Properties';
import { ReliableTopicConfig } from './ReliableTopicConfig';
import { SerializationConfig } from './SerializationConfig';
import { ILogger } from '../logging/ILogger';
import { ConnectionStrategyConfig } from './ConnectionStrategyConfig';
import { LoadBalancerConfig } from './LoadBalancerConfig';
import { MetricsConfig } from './MetricsConfig';
import { SecurityConfig } from './SecurityConfig';
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
    nearCaches?: {
        [name: string]: NearCacheConfig;
    };
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
    reliableTopics?: {
        [name: string]: ReliableTopicConfig;
    };
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
    flakeIdGenerators?: {
        [name: string]: FlakeIdGeneratorConfig;
    };
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
     * Metrics config. Using this config, you can enable client metrics collection and change the frequency of sending client
     * metrics to the cluster. You can monitor clients using Hazelcast Management Center once the metrics collection is enabled.
     */
    metrics?: MetricsConfig;
    /**
     * Contains configuration for the client to use different kinds
     * of credential types during authentication, such as username/password,
     * token, or custom credentials.
     */
    security?: SecurityConfig;
}
