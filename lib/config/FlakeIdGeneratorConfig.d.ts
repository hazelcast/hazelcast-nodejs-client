/**
 * Configuration to be used by the client for the specified FlakeIdGenerator.
 */
export interface FlakeIdGeneratorConfig {
    /**
     * Defines how many IDs are pre-fetched on the background when a new flake id
     * is requested from the cluster. Should be in the range `1..100000`.
     * By default, set to `100`.
     */
    prefetchCount?: number;
    /**
     * Defines for how long the pre-fetched IDs can be used. If this time elapsed,
     * a new batch of IDs will be fetched. Time unit is milliseconds. By default,
     * set to `600000` (10 minutes).
     *
     * The IDs contain timestamp component, which ensures rough global ordering of IDs. If an ID
     * is assigned to an object that was created much later, it will be much out of order. If you don't care
     * about ordering, set this value to `0` for unlimited ID validity.
     */
    prefetchValidityMillis?: number;
}
