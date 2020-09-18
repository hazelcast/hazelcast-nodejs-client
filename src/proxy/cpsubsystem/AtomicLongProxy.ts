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
/** @ignore *//** */

import * as Long from 'long';
import {HazelcastClient} from '../../HazelcastClient';
import {BaseCPProxy} from './BaseCPProxy';
import {IAtomicLong} from '../IAtomicLong';
import {CPProxyManager} from './CPProxyManager';
import {RaftGroupId} from './RaftGroupId';
import {assertNumber} from '../../util/Util';
import {AtomicLongAddAndGetCodec} from '../../codec/AtomicLongAddAndGetCodec';
import {AtomicLongCompareAndSetCodec} from '../../codec/AtomicLongCompareAndSetCodec';
import {AtomicLongGetCodec} from '../../codec/AtomicLongGetCodec';
import {AtomicLongGetAndAddCodec} from '../../codec/AtomicLongGetAndAddCodec';
import {AtomicLongGetAndSetCodec} from '../../codec/AtomicLongGetAndSetCodec';

/** @internal */
export class AtomicLongProxy extends BaseCPProxy implements IAtomicLong {

    constructor(client: HazelcastClient,
                groupId: RaftGroupId,
                proxyName: string,
                objectName: string) {
        super(client, CPProxyManager.ATOMIC_LONG_SERVICE, groupId, proxyName, objectName);
    }

    addAndGet(delta: Long | number): Promise<Long> {
        if (!Long.isLong(delta)) {
            assertNumber(delta);
            delta = Long.fromNumber(delta as number);
        }
        return this.encodeInvokeOnRandomTarget(AtomicLongAddAndGetCodec, this.groupId, this.objectName, delta)
            .then(AtomicLongAddAndGetCodec.decodeResponse);
    }

    compareAndSet(expect: Long | number, update: Long | number): Promise<boolean> {
        if (!Long.isLong(expect)) {
            assertNumber(expect);
            expect = Long.fromNumber(expect as number);
        }
        if (!Long.isLong(update)) {
            assertNumber(update);
            update = Long.fromNumber(update as number);
        }
        return this.encodeInvokeOnRandomTarget(AtomicLongCompareAndSetCodec, this.groupId, this.objectName, expect, update)
            .then(AtomicLongCompareAndSetCodec.decodeResponse);
    }

    decrementAndGet(): Promise<Long> {
        return this.addAndGet(-1);
    }

    get(): Promise<Long> {
        return this.encodeInvokeOnRandomTarget(AtomicLongGetCodec, this.groupId, this.objectName)
            .then(AtomicLongGetCodec.decodeResponse);
    }

    getAndAdd(delta: Long | number): Promise<Long> {
        if (!Long.isLong(delta)) {
            assertNumber(delta);
            delta = Long.fromNumber(delta as number);
        }
        return this.encodeInvokeOnRandomTarget(AtomicLongGetAndAddCodec, this.groupId, this.objectName, delta)
            .then(AtomicLongGetAndAddCodec.decodeResponse);
    }

    getAndSet(newValue: Long | number): Promise<Long> {
        if (!Long.isLong(newValue)) {
            assertNumber(newValue);
            newValue = Long.fromNumber(newValue as number);
        }
        return this.encodeInvokeOnRandomTarget(AtomicLongGetAndSetCodec, this.groupId, this.objectName, newValue)
            .then(AtomicLongGetAndSetCodec.decodeResponse);
    }

    incrementAndGet(): Promise<Long> {
        return this.addAndGet(1);
    }

    getAndIncrement(): Promise<Long> {
        return this.getAndAdd(1);
    }

    set(newValue: Long | number): Promise<void> {
        return this.getAndSet(newValue).then();
    }
}
