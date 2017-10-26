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
