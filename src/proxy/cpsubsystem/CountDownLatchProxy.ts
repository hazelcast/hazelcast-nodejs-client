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
/** @ignore *//** */

import {BaseCPProxy} from './BaseCPProxy';
import {ICountDownLatch} from '../ICountDownLatch';
import {CPProxyManager} from './CPProxyManager';
import {RaftGroupId} from './RaftGroupId';
import {
    assertNumber,
    assertPositiveNumber
} from '../../util/Util';
import {UuidUtil} from '../../util/UuidUtil';
import {CountDownLatchAwaitCodec} from '../../codec/CountDownLatchAwaitCodec';
import {CountDownLatchGetRoundCodec} from '../../codec/CountDownLatchGetRoundCodec';
import {CountDownLatchCountDownCodec} from '../../codec/CountDownLatchCountDownCodec';
import {CountDownLatchGetCountCodec} from '../../codec/CountDownLatchGetCountCodec';
import {CountDownLatchTrySetCountCodec} from '../../codec/CountDownLatchTrySetCountCodec';
import {
    OperationTimeoutError,
    UUID
} from '../../core';
import {InvocationService} from '../../invocation/InvocationService';
import {SerializationService} from '../../serialization/SerializationService';
import {ClientConnectionManager} from '../../network/ClientConnectionManager';


/** @internal */
export class CountDownLatchProxy extends BaseCPProxy implements ICountDownLatch {

    constructor(
        groupId: RaftGroupId,
        proxyName: string,
        objectName: string,
        invocationService: InvocationService,
        serializationService: SerializationService,
        connectionManager: ClientConnectionManager
    ) {
        super(
            CPProxyManager.LATCH_SERVICE,
            groupId,
            proxyName,
            objectName,
            invocationService,
            serializationService,
            connectionManager
        );
    }

    await(timeout: number): Promise<boolean> {
        assertNumber(timeout);
        timeout = Math.max(0, timeout);
        const invocationUid = UuidUtil.generate();
        return this.encodeInvokeOnRandomTarget(
            CountDownLatchAwaitCodec,
            this.groupId,
            this.objectName,
            invocationUid,
            timeout
        ).then(CountDownLatchAwaitCodec.decodeResponse);
    }

    countDown(): Promise<void> {
        const invocationUid = UuidUtil.generate();
        return this.getRound()
            .then((round) => this.doCountDown(round, invocationUid));
    }

    private doCountDown(round: number, invocationUid: UUID): Promise<void> {
        return this.requestCountDown(round, invocationUid)
            .catch((err) => {
                if (err instanceof OperationTimeoutError) {
                    // we can retry safely because the retry is idempotent
                    return this.doCountDown(round, invocationUid);
                }
                throw err;
            });
    }

    private getRound(): Promise<number> {
        return this.encodeInvokeOnRandomTarget(
            CountDownLatchGetRoundCodec,
            this.groupId,
            this.objectName
        ).then(CountDownLatchGetRoundCodec.decodeResponse);
    }

    private requestCountDown(round: number, invocationUid: UUID): Promise<void> {
        return this.encodeInvokeOnRandomTarget(
            CountDownLatchCountDownCodec,
            this.groupId,
            this.objectName,
            invocationUid,
            round
        ).then(() => {});
    }

    getCount(): Promise<number> {
        return this.encodeInvokeOnRandomTarget(
            CountDownLatchGetCountCodec,
            this.groupId,
            this.objectName
        ).then(CountDownLatchGetCountCodec.decodeResponse);
    }

    trySetCount(count: number): Promise<boolean> {
        assertPositiveNumber(count);
        return this.encodeInvokeOnRandomTarget(
            CountDownLatchTrySetCountCodec,
            this.groupId,
            this.objectName,
            count
        ).then(CountDownLatchTrySetCountCodec.decodeResponse);
    }
}
