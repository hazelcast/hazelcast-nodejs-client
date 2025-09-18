import { LoadBalancer } from '../core/LoadBalancer';
/**
 * Defines {@link LoadBalancer} type used by the client.
 */
export declare enum LoadBalancerType {
    /**
     * This type of load balancer picks the next member randomly.
     */
    RANDOM = "RANDOM",
    /**
     * This type of load balancer picks each cluster member in turn.
     */
    ROUND_ROBIN = "ROUND_ROBIN"
}
/**
 * Connection strategy configuration is used for setting custom strategies and configuring strategy parameters.
 */
export interface LoadBalancerConfig {
    /**
     * Defines {@link LoadBalancer} used by the client. Available values
     * are `RANDOM` and `ROUND_ROBIN`. By default, set to `ROUND_ROBIN`.
     */
    type?: LoadBalancerType;
    /**
     * Custom load balancer implementation for the client. When this option is in use,
     * `type` option is ignored.
     */
    customLoadBalancer?: LoadBalancer;
}
