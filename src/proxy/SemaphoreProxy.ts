import {PartitionSpecificProxy} from './PartitionSpecificProxy';
import {ISemaphore} from './ISemaphore';
import * as Promise from 'bluebird';
import {assertNotNegative} from '../Util';
import {SemaphoreInitCodec} from '../codec/SemaphoreInitCodec';
import {SemaphoreAcquireCodec} from '../codec/SemaphoreAcquireCodec';
import {SemaphoreAvailablePermitsCodec} from '../codec/SemaphoreAvailablePermitsCodec';
import {SemaphoreDrainPermitsCodec} from '../codec/SemaphoreDrainPermitsCodec';
import {SemaphoreReducePermitsCodec} from '../codec/SemaphoreReducePermitsCodec';
import {SemaphoreReleaseCodec} from '../codec/SemaphoreReleaseCodec';
import {SemaphoreTryAcquireCodec} from '../codec/SemaphoreTryAcquireCodec';
import Long = require('long');

export class SemaphoreProxy extends PartitionSpecificProxy implements ISemaphore {

    init(permits: number): Promise<boolean> {
        assertNotNegative(permits, 'Permits cannot be negative.');
        return this.encodeInvoke<boolean>(SemaphoreInitCodec, permits);
    }

    acquire(permits: number): Promise<void> {
        assertNotNegative(permits, 'Permits cannot be negative.');
        return this.encodeInvoke<void>(SemaphoreAcquireCodec, permits);
    }

    availablePermits(): Promise<number> {
        return this.encodeInvoke<number>(SemaphoreAvailablePermitsCodec);
    }

    drainPermits(): Promise<number> {
        return this.encodeInvoke<number>(SemaphoreDrainPermitsCodec);
    }

    reducePermits(reduction: number): Promise<void> {
        assertNotNegative(reduction, 'Reduction cannot be negative.');
        return this.encodeInvoke<void>(SemaphoreReducePermitsCodec, reduction);
    }

    release(permits: number): Promise<void> {
        assertNotNegative(permits, 'Permits cannot be negative.');
        return this.encodeInvoke<void>(SemaphoreReleaseCodec, permits);
    }

    tryAcquire(permits: number, timeout: Long|number|string = 0): Promise<boolean> {
        assertNotNegative(permits, 'Permits cannot be negative.');
        return this.encodeInvoke<boolean>(SemaphoreTryAcquireCodec, permits, timeout);
    }
}
