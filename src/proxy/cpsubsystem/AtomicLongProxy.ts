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
import * as Promise from 'bluebird';
import {HazelcastClient} from '../../HazelcastClient';
import {BaseProxy} from '../BaseProxy';
import {IAtomicLong} from '../IAtomicLong';
import {UnsupportedOperationError} from '../../core';
import {ATOMIC_LONG_SERVICE} from './ClientRaftProxyFactory';

/** @internal */
export class AtomicLongProxy<E> extends BaseProxy implements IAtomicLong<E> {

    private readonly groupId: string;
    private readonly objectName: string;

    constructor(client: HazelcastClient, groupId: string, proxyName: string, objectName: string) {
        super(client, ATOMIC_LONG_SERVICE, proxyName);
        this.groupId = groupId;
        this.objectName = objectName;
    }

    getPartitionKey(): string {
        throw new UnsupportedOperationError('This operation is not supported by IAtomicLong.');
    }

    // TODO override
    destroy(): Promise<void> {
        return Promise.resolve();
    }

}
