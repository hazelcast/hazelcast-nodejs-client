/*
 * Copyright (c) 2008-2020, Hazelcast, Inc. All Rights Reserved.
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
import {DistributedObject} from '../DistributedObject';

export interface ILock extends DistributedObject {

    /**
     * Acquires this lock, waiting indefinitely for it to become available.
     * The returned promise will be resolved as soon as this lock is acquired.
     * If lease time is specified then this lock will be held for
     * the specified amount of time and then released automatically.
     * Otherwise it will be held indefinitely up until the user invokes `unlock`.
     * @param leaseMillis period of time in milliseconds for which this lock should be held.
     */
    lock(leaseMillis?: number): Promise<void>;

    /**
     * Tries to acquire this lock within a specified timeout.
     * The returned promise will be resolved either when this lock is acquired or when timeout is reached.
     * Setting timeout to -1 will make this method wait for the lock availability indefinitely.
     * If lease time is specified then this lock will be held for
     * the specified amount of time and then released automatically.
     * Otherwise it will be held indefinitely up until the user invokes `unlock`.
     * @param timeoutMillis period of time in milliseconds to wait for this lock to become available.
     * @param leaseMillis period of time in milliseconds for which this lock should be held.
     * @returns `true` if this lock was obtained in the specified time period, `false` otherwise.
     */
    tryLock(timeoutMillis?: number, leaseMillis?: number): Promise<boolean>;

    /**
     * Unlocks the lock.
     */
    unlock(): Promise<void>;

    /**
     * Forcefully unlocks the lock.
     * Usually, the same client has to call `unlock` the same amount of times
     * as the amount of times it has called `lock`, otherwise the lock will remain in locked state.
     * This method will disregard the acquire count and release this lock immediately.
     */
    forceUnlock(): Promise<void>;

    /**
     * @returns `true` if this lock is currently in the locked state, `false` otherwise.
     */
    isLocked(): Promise<boolean>;

    /**
     * @returns `true` if this lock is currently held by this client, `false` otherwise.
     */
    isLockedByThisClient(): Promise<boolean>;

    /**
     * @returns the number of times this lock was acquired by its owner,
     * i.e. how many times the `unlock` method should be invoked for the lock to become free.
     */
    getLockCount(): Promise<number>;

    /**
     * @returns the number of milliseconds in which the lease for this lock will expire.
     */
    getRemainingLeaseTime(): Promise<number>;
}
