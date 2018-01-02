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
import {PartitionSpecificProxy} from './PartitionSpecificProxy';
import {ILock} from './ILock';

import {LockLockCodec} from '../codec/LockLockCodec';
import {LockGetRemainingLeaseTimeCodec} from '../codec/LockGetRemainingLeaseTimeCodec';
import {LockTryLockCodec} from '../codec/LockTryLockCodec';
import {LockUnlockCodec} from '../codec/LockUnlockCodec';
import {LockForceUnlockCodec} from '../codec/LockForceUnlockCodec';
import {LockIsLockedCodec} from '../codec/LockIsLockedCodec';
import {LockIsLockedByCurrentThreadCodec} from '../codec/LockIsLockedByCurrentThreadCodec';
import {LockGetLockCountCodec} from '../codec/LockGetLockCountCodec';
import * as Long from 'long';
import {LockReferenceIdGenerator} from '../LockReferenceIdGenerator';

export class LockProxy extends PartitionSpecificProxy implements ILock {


    private lockReferenceIdGenerator: LockReferenceIdGenerator = this.client.getLockReferenceIdGenerator();

    private nextSequence(): Long {
        return this.lockReferenceIdGenerator.getNextReferenceId();
    }

    lock(leaseMillis: number = -1): Promise<void> {
        return this.encodeInvoke<void>(LockLockCodec, leaseMillis, 1, this.nextSequence());
    }

    tryLock(timeoutMillis: number = 0, leaseMillis: number = -1): Promise<boolean> {
        return this.encodeInvoke<boolean>(LockTryLockCodec, 1,
            leaseMillis, timeoutMillis, this.nextSequence());
    }

    unlock(): Promise<void> {
        return this.encodeInvoke<void>(LockUnlockCodec, 1, this.nextSequence());
    }

    forceUnlock(): Promise<void> {
        return this.encodeInvoke<void>(LockForceUnlockCodec, this.nextSequence());
    }

    isLocked(): Promise<boolean> {
        return this.encodeInvoke<boolean>(LockIsLockedCodec);
    }

    isLockedByThisClient(): Promise<boolean> {
        return this.encodeInvoke<boolean>(LockIsLockedByCurrentThreadCodec, 1);
    }

    getLockCount(): Promise<number> {
        return this.encodeInvoke<number>(LockGetLockCountCodec);
    }

    getRemainingLeaseTime(): Promise<number> {
        return this.encodeInvoke<Long>(LockGetRemainingLeaseTimeCodec).then(function(long) {
            return long.toNumber();
        });
    }
}
