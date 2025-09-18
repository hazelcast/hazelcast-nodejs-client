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
