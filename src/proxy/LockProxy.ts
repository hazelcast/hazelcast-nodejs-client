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

export class LockProxy extends PartitionSpecificProxy implements ILock {


    lock(leaseMillis: number = -1): Promise<void> {
        return this.encodeInvoke<void>(LockLockCodec, leaseMillis, 1, 0);
    }

    tryLock(timeoutMillis: number = 0, leaseMillis: number = -1): Promise<boolean> {
        return this.encodeInvoke<boolean>(LockTryLockCodec, 1,
            leaseMillis, timeoutMillis, 0);
    }

    unlock(): Promise<void> {
        return this.encodeInvoke<void>(LockUnlockCodec, 1, 0);
    }

    forceUnlock(): Promise<void> {
        return this.encodeInvoke<void>(LockForceUnlockCodec, 0);
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
