export interface Lock {

    /**
     * Acquires the lock, waiting indefinitely if necessary.
     * The returned promise will be resolved as soon as the lock becomes available.
     * After this method is called the user must call `unlock` to release the lock.
     */
    lock(): Promise<void>;

    /**
     * Leases the lock for a specified period of time, waiting indefinitely if necessary.
     * The returned promise will be resolved as soon as the lock becomes available.
     * The lock will be held for the specified amount of time and then released automatically.
     *
     * @param leaseMillis period of time in milliseconds for which the lock should be held.
     */
    lease(leaseMillis: number): Promise<void>;

    /**
     * Tries to acquire the lock, but does not wait for it to become available.
     * @returns `true` if lock was obtained right away, `false` otherwise.
     */
    tryLock(): Promise<boolean>;

    /**
     * Tries to acquire the lock, waiting for the specified amount of time.
     * @param waitMillis period of time in milliseconds to wait for the lock to become available.
     * @returns `true` if the lock was obtained within the specified period, `false` otherwise.
     */
    waitLock(waitMillis: number): Promise<boolean>;

    /**
     * Tries to lease the lock for `leaseMillis`, waiting for the lock to become available for `waitMillis`.
     * @param waitMillis period of time in milliseconds to wait for the lock to become available.
     * @param leaseMillis period of time in milliseconds for which the lock should be held.
     * @returns `true` if the lock was obtained within the specified period, `false` otherwise.
     */
    waitLease(waitMillis: number, leaseMillis: number): Promise<boolean>;

    /**
     * Unlocks the lock.
     */
    unlock(): Promise<void>;

    /**
     * Forcefully unlocks the lock.
     * Usually, the same client has to call `unlock` the same amount of times
     * as the amount of times it has called `lock`, otherwise the lock will remain in locked state.
     * This method will disregard the acquire count and release the lock immediately.
     */
    forceUnlock(): Promise<void>;

    /**
     * Checks if this lock is in the locked state.
     */
    isLocked(): Promise<boolean>;

    /**
     * Checks if this lock was put into the locked state by this client.
     */
    isLockedByThisClient(): Promise<boolean>;

    /**
     * Returns the number of times this lock was acquired by its owner,
     * i.e. how many times the `unlock` method should be invoked for the lock to become free.
     */
    getLockCount(): Promise<number>;

    /**
     * Returns the number of milliseconds in which the lease for this lock will expire.
     */
    getRemainingLeaseTime(): Promise<number>;
}
