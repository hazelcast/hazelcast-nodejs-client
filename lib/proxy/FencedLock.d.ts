import * as Long from 'long';
import { DistributedObject } from '../core';
/**
 * A linearizable, distributed lock.
 *
 * FencedLock is CP with respect to the CAP principle. It works on top
 * of the Raft consensus algorithm. It offers linearizability during crash-stop
 * failures and network partitions. If a network partition occurs, it remains
 * available on at most one side of the partition.
 *
 * FencedLock works on top of CP sessions. Please refer to Hazelcast CP Session
 * documentation section for more information.
 *
 * **Important note:** FencedLock is non-reentrant. Once a caller acquires
 * the lock, it can not acquire the lock reentrantly. So, the next acquire
 * attempt made within the same chain of async calls will lead to a dead lock.
 */
export interface FencedLock extends DistributedObject {
    /**
     * Acquires the lock and returns the fencing token assigned to the current
     * lock acquire.
     *
     * If the lock is not available, then the returned Promise is resolved only
     * when the lock has been acquired.
     *
     * Fencing tokens are monotonic 64-bit integers that are incremented each
     * time the lock switches from the free state to the acquired state.
     * They are simply used for ordering lock holders. A lock holder can pass
     * its fencing to the shared resource to fence off previous lock holders.
     * When this resource receives an operation, it can validate the fencing
     * token in the operation.
     *
     * You can read more about the fencing token idea in Martin Kleppmann's
     * "How to do distributed locking" blog post and Google's Chubby paper.
     *
     * @returns fencing token
     * @throws {@link LockOwnershipLostError} if the underlying CP session was
     *         closed before the client releases the lock
     * @throws {@link IllegalMonitorStateError} If the caller wants to deal with
     * its session loss by taking some custom actions, it can handle the thrown
     */
    lock(): Promise<Long>;
    /**
     * Acquires the lock only if it is free and returns the fencing token
     * assigned to the current lock acquire.
     *
     * If the lock is already held by another caller, then this method
     * immediately returns `undefined`, which means a failed lock attempt.
     *
     * @param timeout optional timeout in milliseconds to acquire the lock
     *                before giving up; when it's not specified the operation
     *                will return immediately after the acquire attempt
     * @returns fencing token (see {@link FencedLock#lock} for more
     *          information on fencing tokens) when lock is acquired;
     *          or `undefined` when attempt failed
     * @throws {@link LockOwnershipLostError} if the underlying CP session was
     *         closed before the client releases the lock
     */
    tryLock(timeout?: number): Promise<Long | undefined>;
    /**
     * Releases the lock if the lock is currently held by the client.
     *
     * @param fence fencing token returned from `lock`/`tryLock` method.
     * @throws TypeError if the given `fence` is not a Long or not valid
     * @throws {@link IllegalMonitorStateError} if the client does not hold
     *         the lock
     * @throws {@link LockOwnershipLostError} if the underlying CP session was
     *         closed before the client releases the lock
     */
    unlock(fence: Long): Promise<void>;
    /**
     * Returns whether this lock is locked or not.
     *
     * @return `true` if this lock is locked by any caller
     *         in the cluster, `false` otherwise.
     * @throws {@link LockOwnershipLostError} if the underlying CP session was
     *         closed before the client releases the lock
     */
    isLocked(): Promise<boolean>;
}
