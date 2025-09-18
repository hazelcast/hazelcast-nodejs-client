import { DistributedObject } from '../core';
/**
 * A distributed, concurrent countdown latch data structure.
 *
 * ICountDownLatch is a cluster-wide synchronization aid
 * that allows one or more callers to wait until a set of operations being
 * performed in other callers completes.
 *
 * ICountDownLatch count can be reset using `trySetCount()` method after
 * a countdown has finished but not during an active count. This allows
 * the same latch instance to be reused.
 *
 * There is no `await()` method to do an unbound wait since this is undesirable
 * in a distributed application: for example, a cluster can split, or the master
 * and replicas could all die. In most cases, it is best to configure
 * an explicit timeout, so you have the ability to deal with these situations.
 *
 * All of the API methods in the ICountDownLatch offer the exactly-once
 * execution semantics. For instance, even if a `countDown()` call is
 * internally retried because of crashed Hazelcast member, the counter
 * value is decremented only once.
 */
export interface ICountDownLatch extends DistributedObject {
    /**
     * Causes the call to wait until the latch has counted down to
     * zero, or an exception is thrown, or the specified waiting time elapses.
     *
     * If the current count is zero then the promise resolves immediately
     * with the value `true`.
     *
     * If the current count is greater than zero, then the promise
     * is fulfilled only when one of the following things happen:
     * <ul>
     * <li>
     * the count reaches zero due to invocations of the `countDown()` method,
     * </li>
     * <li>
     * this ICountDownLatch instance is destroyed,
     * </li>
     * <li>
     * the countdown owner becomes disconnected,
     * </li>
     * <li>
     * the specified waiting time elapses.
     * </li>
     * </ul>
     *
     * If the count reaches zero, then the method returns with the
     * value `true`.
     *
     * @param timeout timeout in milliseconds to wait for the count
     *                to reach zero; if the timeout is less than or equal to
     *                zero, the method will not wait at all
     * @returns `true` if the count reached zero, `false` if the waiting
     *          time elapsed before the count reached zero
     * @throws {@link IllegalStateError} if the Hazelcast instance was shut down
     *         while waiting
     */
    await(timeout: number): Promise<boolean>;
    /**
     * Decrements the count of the latch, releasing all waiting calls if
     * the count reaches zero.
     *
     * If the current count is greater than zero, then it is decremented.
     * If the new count is zero, then all waiting callers are notified
     * and can proceed, and the countdown owner is set to `null`.
     *
     * If the current count equals zero, then nothing happens.
     */
    countDown(): Promise<void>;
    /**
     * Returns the current count.
     *
     * @returns the current count
     */
    getCount(): Promise<number>;
    /**
     * Sets the count to the given value if the current count is zero.
     *
     * If count is not zero, then this method does nothing and returns
     * `false`.
     *
     * @param count the number of times `countDown()` must be invoked
     *              before callers can pass through `await()`
     * @returns `true` if the new count was set, `false` if the current
     *          count is not zero
     */
    trySetCount(count: number): Promise<boolean>;
}
