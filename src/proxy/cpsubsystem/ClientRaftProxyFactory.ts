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

import * as Promise from 'bluebird';
import {
    DistributedObject,
    IllegalStateError
} from '../../core';
import {HazelcastClient} from '../../HazelcastClient';
import {AtomicLongProxy} from './AtomicLongProxy';

/** @internal */
export const ATOMIC_LONG_SERVICE = 'hz:raft:atomicLongService';

/** @internal */
export function withoutDefaultGroupName(name: string): string {
    // TODO
    return name;
}

/** @internal */
export function getGroupNameForProxy(name: string): string {
    // TODO
    return name;
}

/** @internal */
export class ClientRaftProxyFactory {

    private readonly client: HazelcastClient;

    constructor(client: HazelcastClient) {
        this.client = client;
    }

    public getOrCreateProxy(proxyName: string, serviceName: string): Promise<DistributedObject> {
        proxyName = withoutDefaultGroupName(proxyName);
        const objectName = getGroupNameForProxy(proxyName);

        return this.getGroupId(proxyName, objectName).then((groupId) => {
            if (serviceName === ATOMIC_LONG_SERVICE) {
                return new AtomicLongProxy(this.client, groupId, proxyName, objectName);
            }
            throw new IllegalStateError('Unexpected service name: ' + serviceName);
        });
    }

    private getGroupId(proxyName: string, objectName: string): Promise<string> {
        return Promise.resolve('TODO');
    }
}
