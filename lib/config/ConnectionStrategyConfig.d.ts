import { ConnectionRetryConfig } from './ConnectionRetryConfig';
/**
 * Reconnect mode.
 */
export declare enum ReconnectMode {
    /**
     * Prevent reconnect to cluster after a disconnect
     */
    OFF = "OFF",
    /**
     * Reconnect to cluster by blocking invocations
     */
    ON = "ON",
    /**
     * Reconnect to cluster without blocking invocations. Invocations will receive
     * {@link ClientOfflineError}
     */
    ASYNC = "ASYNC"
}
/**
 * Connection strategy configuration is used for setting custom strategies and configuring strategy parameters.
 */
export interface ConnectionStrategyConfig {
    /**
     * Enables non-blocking start mode of {@link HazelcastClient.newHazelcastClient}.
     * When set to `true`, the client creation will not wait to connect to cluster.
     * The client instance will throw exceptions until it connects to cluster and becomes
     * ready. If set to `false`, {@link HazelcastClient.newHazelcastClient} will block
     * until a cluster connection established, and it is ready to use the client instance.
     * By default, set to `false`.
     */
    asyncStart?: boolean;
    /**
     * Defines how a client reconnects to cluster after a disconnect. Available values
     * are `ON`, `OFF` and `ASYNC`. By default, set to `ON`.
     */
    reconnectMode?: ReconnectMode;
    /**
     * Connection retry config to be used by the client.
     */
    connectionRetry?: ConnectionRetryConfig;
}
