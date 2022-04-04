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
/** @ignore *//** */

import * as Long from 'long';
import {BaseCPProxy} from './BaseCPProxy';
import {ISemaphore} from '../ISemaphore';
import {CPProxyManager} from './CPProxyManager';
import {CPSessionManager, NO_SESSION_ID} from './CPSessionManager';
import {RaftGroupId} from './RaftGroupId';
import {
    assertNonNegativeNumber,
    assertPositiveNumber
} from '../../util/Util';
import {UuidUtil} from '../../util/UuidUtil';
import {SemaphoreInitCodec} from '../../codec/SemaphoreInitCodec';
import {SemaphoreAcquireCodec} from '../../codec/SemaphoreAcquireCodec';
import {SemaphoreAvailablePermitsCodec} from '../../codec/SemaphoreAvailablePermitsCodec';
import {SemaphoreDrainCodec} from '../../codec/SemaphoreDrainCodec';
import {SemaphoreChangeCodec} from '../../codec/SemaphoreChangeCodec';
import {SemaphoreReleaseCodec} from '../../codec/SemaphoreReleaseCodec';
import {
    IllegalStateError,
    WaitKeyCancelledError
} from '../../core';
import {SerializationService} from '../../serialization/SerializationService';
import {InvocationService} from '../../invocation/InvocationService';


/** @internal */
export class SessionlessSemaphoreProxy extends BaseCPProxy implements ISemaphore {

    private readonly sessionManager: CPSessionManager;

    constructor(
        groupId: RaftGroupId,
        proxyName: string,
        objectName: string,
        invocationService: InvocationService,
        serializationService: SerializationService,
        cpSessionManager: CPSessionManager
    ) {
        super(
            CPProxyManager.SEMAPHORE_SERVICE,
            groupId,
            proxyName,
            objectName,
            invocationService,
            serializationService
        );
        this.sessionManager = cpSessionManager;
    }

    init(permits: number): Promise<boolean> {
        assertNonNegativeNumber(permits);
        return this.encodeInvokeOnRandomTarget(SemaphoreInitCodec, this.groupId, this.objectName, permits)
            .then(SemaphoreInitCodec.decodeResponse);
    }

    acquire(permits = 1): Promise<void> {
        assertPositiveNumber(permits);

        return this.doTryAcquire(permits, -1).then(() => {});
    }

    tryAcquire(permits = 1, timeout = 0): Promise<boolean> {
        assertPositiveNumber(permits);
        assertNonNegativeNumber(timeout);

        return this.doTryAcquire(permits, timeout);
    }

    private doTryAcquire(permits: number, timeout: number): Promise<boolean> {
        const invocationUid = UuidUtil.generate();
        return this.getClusterWideThreadId()
            .then((clusterWideThreadId) =>
                this.encodeInvokeOnRandomTarget(
                    SemaphoreAcquireCodec,
                    this.groupId,
                    this.objectName,
                    NO_SESSION_ID,
                    clusterWideThreadId,
                    invocationUid,
                    permits,
                    Long.fromNumber(timeout)
                )
            )
            .then(SemaphoreAcquireCodec.decodeResponse)
            .catch((err) => {
                if (err instanceof WaitKeyCancelledError) {
                    throw new IllegalStateError('Semaphore[' + this.objectName
                        + '] not acquired because the acquire call on the CP group was cancelled.');
                }
                throw err;
            });
    }

    release(permits = 1): Promise<void> {
        assertPositiveNumber(permits);

        const invocationUid = UuidUtil.generate();
        return this.getClusterWideThreadId()
            .then((clusterWideThreadId) =>
                this.encodeInvokeOnRandomTarget(
                    SemaphoreReleaseCodec,
                    this.groupId,
                    this.objectName,
                    NO_SESSION_ID,
                    clusterWideThreadId,
                    invocationUid,
                    permits
                )
            )
            .then(() => {});
    }

    availablePermits(): Promise<number> {
        return this.encodeInvokeOnRandomTarget(SemaphoreAvailablePermitsCodec, this.groupId, this.objectName)
            .then(SemaphoreAvailablePermitsCodec.decodeResponse);
    }

    drainPermits(): Promise<number> {
        const invocationUid = UuidUtil.generate();
        return this.getClusterWideThreadId()
            .then((clusterWideThreadId) =>
                this.encodeInvokeOnRandomTarget(
                    SemaphoreDrainCodec,
                    this.groupId,
                    this.objectName,
                    NO_SESSION_ID,
                    clusterWideThreadId,
                    invocationUid
                )
            )
            .then(SemaphoreDrainCodec.decodeResponse);
    }

    reducePermits(reduction: number): Promise<void> {
        assertNonNegativeNumber(reduction);
        if (reduction === 0) {
            return Promise.resolve();
        }
        return this.doChangePermits(-reduction);
    }

    increasePermits(increase: number): Promise<void> {
        assertNonNegativeNumber(increase);
        if (increase === 0) {
            return Promise.resolve();
        }
        return this.doChangePermits(increase);
    }

    private doChangePermits(delta: number): Promise<void> {
        const invocationUid = UuidUtil.generate();
        return this.getClusterWideThreadId()
            .then((clusterWideThreadId) =>
                this.encodeInvokeOnRandomTarget(
                    SemaphoreChangeCodec,
                    this.groupId,
                    this.objectName,
                    NO_SESSION_ID,
                    clusterWideThreadId,
                    invocationUid,
                    delta
                )
            )
            .then(() => {});
    }

    private getClusterWideThreadId(): Promise<Long> {
        return this.sessionManager.createUniqueThreadId(this.groupId);
    }
}
