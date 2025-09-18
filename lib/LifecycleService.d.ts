/**
 * Lifecycle states.
 */
export declare enum LifecycleState {
    /**
     * Fired when the client is starting.
     */
    STARTING = "STARTING",
    /**
     * Fired when the client's start is completed.
     */
    STARTED = "STARTED",
    /**
     * Fired when the client is shutting down.
     */
    SHUTTING_DOWN = "SHUTTING_DOWN",
    /**
     * Fired when the client's shut down is completed.
     */
    SHUTDOWN = "SHUTDOWN",
    /**
     * Fired when the client is connected to the member.
     */
    CONNECTED = "CONNECTED",
    /**
     * Fired when the client is disconnected from the cluster.
     */
    DISCONNECTED = "DISCONNECTED",
    /**
     * Fired when the client is connected to a new cluster.
     */
    CHANGED_CLUSTER = "CHANGED_CLUSTER"
}
/**
 * Allows determining whether the client is active and emits client state events.
 * To register lifecycle listeners, use {@link ClientConfig.lifecycleListeners} config.
 */
export interface LifecycleService {
    /**
     * Returns true if the client is running. The client is considered to be running between initialization
     * and start of its shutdown process.
     */
    isRunning(): boolean;
}
