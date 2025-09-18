import * as Long from 'long';
import { DistributedObject } from '../core/DistributedObject';
/**
 * PN (Positive-Negative) CRDT counter.
 *
 * The counter supports adding and subtracting values as well as
 * retrieving the current counter value.
 * The counter guarantees that whenever two nodes have received the
 * same set of updates, possibly in a different order, their state is
 * identical, and any conflicting updates are merged automatically.
 * If no new updates are made to the shared state, all nodes that can
 * communicate will eventually have the same data.
 *
 * The invocation is remote. This may lead to indeterminate state -
 * the update may be applied, but the response has not been received.
 * In this case, the caller will be notified with a `TargetDisconnectedError`
 *
 * The read and write methods provide monotonic read and RYW (read-your-write)
 * guarantees. These guarantees are session guarantees which means that if
 * no replica with the previously observed state is reachable, the session
 * guarantees are lost, and the method invocation will throw a
 * `ConsistencyLostError`. This does not mean
 * that an update is lost. All the updates are part of some replica and
 * will be eventually reflected in the state of all other replicas. This
 * error just means that you cannot observe your own writes because
 * all replicas that contain your updates are currently unreachable.
 * After you have received a `ConsistencyLostError`, you can either
 * wait for a sufficiently up-to-date replica to become reachable in which
 * case the session can be continued, or you can reset the session by calling
 * the `reset()` method. If you have called the `reset()` method,
 * a new session is started with the next invocation to a CRDT replica.
 *
 * **NOTE:**
 * The CRDT state is kept entirely on non-lite (data) members. If there
 * aren't any and the methods here are invoked, they will
 * fail with a `NoDataMemberInClusterError`.
 */
export interface PNCounter extends DistributedObject {
    /**
     * Returns the current value of the counter.
     *
     * @throws {@link NoDataMemberInClusterError} if the cluster does not contain
     *                                        any data members
     * @throws {@link UnsupportedOperationError}  if the cluster version is less
     *                                        than 3.10
     * @throws {@link ConsistencyLostError}       if the session guarantees have
     *                                        been lost
     * @returns the current value of the counter
     */
    get(): Promise<Long>;
    /**
     * Adds the given value to the current value.
     *
     * @param delta the value to add
     * @return the previous value
     * @throws {@link NoDataMemberInClusterError} if the cluster does not contain
     *                                        any data members
     * @throws {@link UnsupportedOperationError}  if the cluster version is less
     *                                        than 3.10
     * @throws {@link ConsistencyLostError}       if the session guarantees have
     *                                        been lost
     */
    getAndAdd(delta: Long | number): Promise<Long>;
    /**
     * Adds the given value to the current value.
     *
     * @param delta the value to add
     * @return the updated value
     * @throws {@link NoDataMemberInClusterError} if the cluster does not contain
     *                                        any data members
     * @throws {@link UnsupportedOperationError}  if the cluster version is less
     *                                        than 3.10
     * @throws {@link ConsistencyLostError}       if the session guarantees have
     *                                        been lost
     */
    addAndGet(delta: Long | number): Promise<Long>;
    /**
     * Subtracts the given value from the current value.
     *
     * @param delta the value to add
     * @return the previous value
     * @throws {@link NoDataMemberInClusterError} if the cluster does not contain
     *                                        any data members
     * @throws {@link UnsupportedOperationError}  if the cluster version is less
     *                                        than 3.10
     * @throws {@link ConsistencyLostError}       if the session guarantees have
     *                                        been lost
     */
    getAndSubtract(delta: Long | number): Promise<Long>;
    /**
     * Subtracts the given value from the current value.
     *
     * @param delta the value to subtract
     * @return the updated value
     * @throws {@link NoDataMemberInClusterError} if the cluster does not contain
     *                                        any data members
     * @throws {@link UnsupportedOperationError}  if the cluster version is less
     *                                        than 3.10
     * @throws {@link ConsistencyLostError}       if the session guarantees have
     *                                        been lost
     */
    subtractAndGet(delta: Long | number): Promise<Long>;
    /**
     * Decrements by one the current value.
     *
     * @return the updated value
     * @throws {@link NoDataMemberInClusterError} if the cluster does not contain
     *                                        any data members
     * @throws {@link UnsupportedOperationError}  if the cluster version is less
     *                                        than 3.10
     * @throws {@link ConsistencyLostError}       if the session guarantees have
     *                                        been lost
     */
    decrementAndGet(): Promise<Long>;
    /**
     * Increments by one the current value.
     *
     * @return the updated value
     * @throws {@link NoDataMemberInClusterError} if the cluster does not contain
     *                                        any data members
     * @throws {@link UnsupportedOperationError}  if the cluster version is less
     *                                        than 3.10
     * @throws {@link ConsistencyLostError}       if the session guarantees have
     *                                        been lost
     */
    incrementAndGet(): Promise<Long>;
    /**
     * Decrements by one the current value.
     *
     * @return the previous value
     * @throws {@link NoDataMemberInClusterError} if the cluster does not contain
     *                                        any data members
     * @throws {@link UnsupportedOperationError}  if the cluster version is less
     *                                        than 3.10
     * @throws {@link ConsistencyLostError}       if the session guarantees have
     *                                        been lost
     */
    getAndDecrement(): Promise<Long>;
    /**
     * Increments by one the current value.
     *
     * @return the previous value
     * @throws {@link NoDataMemberInClusterError} if the cluster does not contain
     *                                        any data members
     * @throws {@link UnsupportedOperationError}  if the cluster version is less
     *                                        than 3.10
     * @throws {@link ConsistencyLostError}       if the session guarantees have
     *                                        been lost
     */
    getAndIncrement(): Promise<Long>;
    /**
     * Resets the observed state by this PN counter. This method may be used
     * after a method invocation has thrown a `ConsistencyLostError`
     * to reset the proxy and to be able to start a new session.
     */
    reset(): Promise<void>;
}
