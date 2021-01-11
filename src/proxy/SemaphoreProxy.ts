/*
 * Copyright (c) 2008-2021, Hazelcast, Inc. All Rights Reserved.
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
import {SemaphoreAcquireCodec} from '../codec/SemaphoreAcquireCodec';
import {SemaphoreAvailablePermitsCodec} from '../codec/SemaphoreAvailablePermitsCodec';
import {SemaphoreDrainPermitsCodec} from '../codec/SemaphoreDrainPermitsCodec';
import {SemaphoreInitCodec} from '../codec/SemaphoreInitCodec';
import {SemaphoreReducePermitsCodec} from '../codec/SemaphoreReducePermitsCodec';
import {SemaphoreReleaseCodec} from '../codec/SemaphoreReleaseCodec';
import {SemaphoreTryAcquireCodec} from '../codec/SemaphoreTryAcquireCodec';
import {assertNotNegative} from '../Util';
import {ISemaphore} from './ISemaphore';
import {PartitionSpecificProxy} from './PartitionSpecificProxy';
import Long = require('long');

export class SemaphoreProxy extends PartitionSpecificProxy implements ISemaphore {

    init(permits: number): Promise<boolean> {
        assertNotNegative(permits, 'Permits cannot be negative.');
        return this.encodeInvoke<boolean>(SemaphoreInitCodec, permits);
    }

    acquire(permits: number = 1): Promise<void> {
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

    release(permits: number = 1): Promise<void> {
        assertNotNegative(permits, 'Permits cannot be negative.');
        return this.encodeInvoke<void>(SemaphoreReleaseCodec, permits);
    }

    tryAcquire(permits: number, timeout: Long | number = 0): Promise<boolean> {
        assertNotNegative(permits, 'Permits cannot be negative.');
        return this.encodeInvoke<boolean>(SemaphoreTryAcquireCodec, permits, timeout);
    }
}
