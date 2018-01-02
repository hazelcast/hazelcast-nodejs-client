/*
 * Copyright (c) 2008-2017, Hazelcast, Inc. All Rights Reserved.
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
import * as Long from 'long';
import {IAtomicLong} from './IAtomicLong';
import {PartitionSpecificProxy} from './PartitionSpecificProxy';
import {AtomicLongAddAndGetCodec} from '../codec/AtomicLongAddAndGetCodec';
import {AtomicLongGetCodec} from '../codec/AtomicLongGetCodec';
import {AtomicLongGetAndAddCodec} from '../codec/AtomicLongGetAndAddCodec';
import {AtomicLongDecrementAndGetCodec} from '../codec/AtomicLongDecrementAndGetCodec';
import {AtomicLongSetCodec} from '../codec/AtomicLongSetCodec';
import {AtomicLongCompareAndSetCodec} from '../codec/AtomicLongCompareAndSetCodec';
import {AtomicLongGetAndSetCodec} from '../codec/AtomicLongGetAndSetCodec';
import {AtomicLongIncrementAndGetCodec} from '../codec/AtomicLongIncrementAndGetCodec';
import {AtomicLongGetAndIncrementCodec} from '../codec/AtomicLongGetAndIncrementCodec';

export class AtomicLongProxy extends PartitionSpecificProxy implements IAtomicLong {
    addAndGet(delta: Long|number): Promise<Long> {
        return this.encodeInvoke<Long>(AtomicLongAddAndGetCodec, delta);
    }

    compareAndSet(expect: Long|number, update: Long|number): Promise<boolean> {
        return this.encodeInvoke<boolean>(AtomicLongCompareAndSetCodec, expect, update);
    }

    decrementAndGet(): Promise<Long> {
        return this.encodeInvoke<Long>(AtomicLongDecrementAndGetCodec);
    }

    get(): Promise<Long> {
        return this.encodeInvoke<Long>(AtomicLongGetCodec);
    }

    getAndAdd(delta: Long|number): Promise<Long> {
        return this.encodeInvoke<Long>(AtomicLongGetAndAddCodec, delta);
    }

    getAndSet(newValue: Long|number): Promise<Long> {
        return this.encodeInvoke<Long>(AtomicLongGetAndSetCodec, newValue);
    }

    incrementAndGet(): Promise<Long> {
        return this.encodeInvoke<Long>(AtomicLongIncrementAndGetCodec);
    }

    getAndIncrement(): Promise<Long> {
        return this.encodeInvoke<Long>(AtomicLongGetAndIncrementCodec);
    }

    set(newValue: Long|number): Promise<void> {
        return this.encodeInvoke<void>(AtomicLongSetCodec, newValue);
    }

}
