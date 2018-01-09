/*
 * Copyright (c) 2008-2018, Hazelcast, Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

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
