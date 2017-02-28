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
     * If insufficient permits are available returned promise is not resolved
     * until until there are sufficient number of available permits or this
     * {ISemaphore} is destroyed.
     * @param permits
     */
    acquire(permits?: number): Promise<void>;

    /**
     * Returns the current number of permits currently available in this semaphore.
     * This message is idempotent.
     */
    availablePermits(): Promise<number>;

    /**
     * Acquires and returns all permits that are immediately available.
     */
    drainPermits(): Promise<number>;

    /**
     * Shrinks the number of available permits by the indicated reduction.
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
    release(permits?: number): Promise<void>;

    /**
     * Acquires the given number of permits, if they are available, and returns
     * immediately, with the value true, reducing the number of available permits
     * by the given amount. If insufficient permits are available then this
     * method will return immediately with the value false and the number of
     * available permits is unchanged.
     * @param permits
     * @param timeout
     */
    tryAcquire(permits: number, timeout: Long | number): Promise<boolean>;
}
