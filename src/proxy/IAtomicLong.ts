/*
 * Copyright (c) 2008-2022, Hazelcast, Inc. All Rights Reserved.
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

import * as Long from 'long';
import {DistributedObject} from '../core';

/**
 * IAtomicLong is a redundant and highly available distributed counter
 * for 64-bit integers (`long` type in java).
 *
 * It works on top of the Raft consensus algorithm. It offers linearizability
 * during crash failures and network partitions. It is CP with respect to
 * the CAP principle. If a network partition occurs, it remains available
 * on at most one side of the partition.
 *
 * IAtomicLong implementation does not offer exactly-once / effectively-once
 * execution semantics. It goes with at-least-once execution semantics
 * by default and can cause an API call to be committed multiple times
 * in case of CP member failures. It can be tuned to offer at-most-once
 * execution semantics. Please see `fail-on-indeterminate-operation-state`
 * server-side setting.
 */
export interface IAtomicLong extends DistributedObject {

    /**
     * Atomically adds the given value to the current value.
     *
     * @param delta the value to add to the current value
     * @returns the updated value, the given value added to the current value
     */
    addAndGet(delta: Long | number): Promise<Long>;

    /**
     * Atomically sets the value to the given updated value
     * only if the current value equals the expected value.
     *
     * @param expect the expected value
     * @param update the new value
     * @returns `true` if successful; or `false` if the actual value
     * was not equal to the expected value.
     */
    compareAndSet(expect: Long | number, update: Long | number): Promise<boolean>;

    /**
     * Atomically decrements the current value by one.
     *
     * @returns the updated value, the current value decremented by one
     */
    decrementAndGet(): Promise<Long>;

    /**
     * Gets the current value.
     *
     * @returns the current value
     */
    get(): Promise<Long>;

    /**
     * Atomically adds the given value to the current value.
     *
     * @param delta the value to add to the current value
     * @returns the old value before the add
     */
    getAndAdd(delta: Long | number): Promise<Long>;

    /**
     * Atomically decrements the current value by one.
     *
     * @returns the old value
     */
    getAndDecrement(): Promise<Long>;

    /**
     * Atomically sets the given value and returns the old value.
     *
     * @param newValue the new value
     * @returns the old value
     */
    getAndSet(newValue: Long | number): Promise<Long>;

    /**
     * Atomically increments the current value by one.
     *
     * @returns the updated value, the current value incremented by one
     */
    incrementAndGet(): Promise<Long>;

    /**
     * Atomically increments the current value by one.
     *
     * @returns the old value
     */
    getAndIncrement(): Promise<Long>;

    /**
     * Atomically sets the given value.
     *
     * @param newValue the new value
     */
    set(newValue: Long | number): Promise<void>;
}
