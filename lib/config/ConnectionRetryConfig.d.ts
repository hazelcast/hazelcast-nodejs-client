/**
 * Connection retry config controls the period among connection establish retries
 * and defines when the client should give up retrying. Supports exponential behaviour
 * with jitter for wait periods.
 */
export interface ConnectionRetryConfig {
    /**
     * Defines wait period in millisecond after the first failure before retrying.
     * Must be non-negative. By default, set to `1000`.
     */
    initialBackoffMillis?: number;
    /**
     * Defines an upper bound for the backoff interval in milliseconds. Must be
     * non-negative. By default, set to `30000` (30 seconds).
     */
    maxBackoffMillis?: number;
    /**
     * Defines timeout value in milliseconds for the client's connection
     * attempts to a cluster. Must be non-negative unless it is set to -1.
     * If set to -1, the client tries to connect to the cluster forever.
     * If set to 0, the client won't try to connect anymore after the first attempt fails.
     * By default, set to -1 (no timeout).
     */
    clusterConnectTimeoutMillis?: number;
    /**
     * Defines the factor with which to multiply backoff after a failed retry.
     * Must be greater than or equal to `1`. By default, set to `1.05`.
     */
    multiplier?: number;
    /**
     * Defines how much to randomize backoffs. At each iteration the calculated
     * back-off is randomized via following method in pseudo-code
     * `Random(-jitter * current_backoff, jitter * current_backoff)`.
     * Must be in range `[0.0, 1.0]`. By default, set to `0` (no randomization).
     */
    jitter?: number;
}
