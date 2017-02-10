import * as Promise from 'bluebird';
import Long = require('long');
import {DistributedObject} from '../DistributedObject';

export interface ISemaphore extends DistributedObject {
    /**
     * Try to initialize this ISemaphore instance with the given permit count.
     * @param permits
     */
    init(permits: number): Promise<boolean>;

    /**
     * Acquires the given number of permits if they are available, and returns
     * immediately, reducing the number of available permits by the given amount.
     * If insufficient permits are available then the current thread becomes
     * disabled for thread scheduling purposes and lies dormant until one of three
     * things happens: some other thread invokes one of the methods for this semaphore,
     * the current thread is next to be assigned permits and the number of available
     * permits satisfies this request, this ISemaphore instance is destroyed, or
     * some other thread the current thread. If the current thread has its interrupted
     * status set on entry to this method, or is while waiting for a permit, then is
     * thrown and the current thread's interrupted status is cleared.
     * @param permits
     */
    acquire(permits: number): Promise<void>;

    /**
     * Returns the current number of permits currently available in this semaphore.
     * This method is typically used for debugging and testing purposes.
     * This message is idempotent.
     */
    availablePermits(): Promise<number>;

    /**
     * Acquires and returns all permits that are immediately available.
     */
    drainPermits(): Promise<number>;

    /**
     * Shrinks the number of available permits by the indicated reduction.
     * This method differs from acquire in that it does not block waiting
     * for permits to become available.
     * @param reduction
     */
    reducePermits(reduction: number): Promise<void>;

    /**
     * Releases the given number of permits, increasing the number of available
     * permits by that amount. There is no requirement that a thread that releases a
     * permit must have acquired that permit by calling one of the acquire()acquire
     * methods. Correct usage of a semaphore is established by programming convention
     * in the application
     */
    release(permits: number): Promise<void>;

    /**
     * Acquires the given number of permits, if they are available, and returns
     * immediately, with the value true, reducing the number of available permits
     * by the given amount. If insufficient permits are available then this
     * method will return immediately with the value false and the number of
     * available permits is unchanged.
     * @param permits
     * @param timeout
     */
    tryAcquire(permits: number, timeout: Long|number|string): Promise<boolean>;
}
