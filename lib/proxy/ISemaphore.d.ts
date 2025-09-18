import { DistributedObject } from '../core';
/**
 * A linearizable, distributed semaphore.
 *
 * ISemaphore works on top of the Raft consensus algorithm. It offers
 * linearizability during crash failures and network partitions. It is CP with
 * respect to the CAP principle. If a network partition occurs, it remains
 * available on at most one side of the partition.
 *
 * ISemaphore is a cluster-wide counting semaphore. Conceptually, it maintains
 * a set of permits. Each `acquire()` waits if necessary until a permit
 * is available, and then takes it. Dually, each `release()` adds a
 * permit, potentially releasing a waiting acquirer. However, no actual permit
 * objects are used; the semaphore just keeps a count of the number available
 * and acts accordingly.
 *
 * This data structure also provides convenience methods to work
 * with multiple permits at once. Beware of the increased risk of
 * indefinite postponement when using the multiple-permit acquire. If permits
 * are released one by one, a caller waiting for one permit will acquire
 * it before a caller waiting for multiple permits regardless of the call
 * order.
 *
 * Correct usage of a semaphore is established by programming convention
 * in the application.
 *
 * ISemaphore has two variations:
 * <ul>
 * <li>
 * The default implementation is session-aware. In this one, when a caller
 * makes its very first `acquire()` call, it starts a new CP session with
 * the underlying CP group. Then, liveliness of the caller is tracked via
 * this CP session. When the caller fails, permits acquired by this caller
 * are automatically and safely released. However, the session-aware version
 * comes with a limitation, that is, a Hazelcast client cannot release permits
 * before acquiring them first. In other words, a client can release only
 * the permits it has acquired earlier.
 * </li>
 * <li>
 * The second implementation is sessionless. This one does not perform
 * auto-cleanup of acquired permits on failures. Acquired permits are not
 * bound to callers and permits can be released without acquiring first.
 * However, you need to handle failed permit owners on your own. If a Hazelcast
 * server or a client fails while holding some permits, they will not be
 * automatically released. You can use the sessionless CP ISemaphore
 * implementation by enabling JDK compatibility `jdk-compatible` server-side
 * setting. Refer to Semaphore configuration documentation for more details.
 * </li>
 * </ul>
 */
export interface ISemaphore extends DistributedObject {
    /**
     * Tries to initialize this ISemaphore instance with the given permit count.
     *
     * @param permits the given permit count
     * @returns `true` if initialization success; `false` if already initialized
     */
    init(permits: number): Promise<boolean>;
    /**
     * Acquires the given number of permits if they are available,
     * and returns immediately, reducing the number of available permits
     * by the given amount.
     *
     * If insufficient permits are available then the returned promise is not
     * resolved until there are sufficient number of available permits or this
     * ISemaphore is destroyed.
     *
     * @param permits optional number of permits to acquire; defaults to `1`
     *                when not specified
     */
    acquire(permits?: number): Promise<void>;
    /**
     * Acquires the given number of permits and returns `true`, if they
     * become available during the given timeout. If permits are acquired,
     * the number of available permits in the ISemaphore instance is also
     * reduced by the given amount.
     *
     * @param permits the number of permits to acquire; defaults to `1`
     *                when not specified
     * @param timeout optional timeout in milliseconds to wait for the permits;
     *                when it's not specified the operation will return
     *                immediately after the acquire attempt
     * @returns `true` if all permits were acquired, `false` if the waiting
     *          time elapsed before all permits could be acquired
     */
    tryAcquire(permits?: number, timeout?: number): Promise<boolean>;
    /**
     * Releases the given number of permits and increases the number of
     * available permits by that amount. If some callers in the cluster are
     * waiting for acquiring permits, they will be notified.
     *
     * If the underlying ISemaphore implementation is non-JDK-compatible
     * (configured via `jdk-compatible` server-side setting), then a client can
     * only release a permit which it has acquired before. In other words, a client
     * cannot release a permit without acquiring it first.
     *
     * Otherwise, which means the default implementation, there is no such
     * requirement for clients. A client can freely release a permit without
     * acquiring it first. In this case, correct usage of a semaphore is established
     * by programming convention in the application.
     *
     * @param permits the number of permits to release
     * @throws {@link IllegalStateError} if the Semaphore is non-JDK-compatible
     *         and the caller does not have a permit
     */
    release(permits?: number): Promise<void>;
    /**
     * Returns the current number of permits currently available in this semaphore.
     *
     * This method is typically used for debugging and testing purposes.
     *
     * @returns the number of permits available in this semaphore
     */
    availablePermits(): Promise<number>;
    /**
     * Acquires and returns all permits that are available at invocation time.
     *
     * @returns the number of permits drained
     */
    drainPermits(): Promise<number>;
    /**
     * Reduces the number of available permits by the indicated amount. This
     * method differs from `acquire()` as it does not block until permits
     * become available. Similarly, if the caller has acquired some permits,
     * they are not released with this call.
     *
     * @param reduction the number of permits to reduce
     */
    reducePermits(reduction: number): Promise<void>;
    /**
     * Increases the number of available permits by the indicated amount. If
     * there are some callers waiting for permits to become available, they
     * will be notified. Moreover, if the caller has acquired some permits,
     * they are not released with this call.
     *
     * @param increase the number of permits to increase
     */
    increasePermits(increase: number): Promise<void>;
}
