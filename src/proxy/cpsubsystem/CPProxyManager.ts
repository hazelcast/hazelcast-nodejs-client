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

import * as assert from 'assert';
import * as Promise from 'bluebird';
import {
    DistributedObject,
    IllegalStateError
} from '../../core';
import {HazelcastClient} from '../../HazelcastClient';
import {AtomicLongProxy} from './AtomicLongProxy';
import {RaftGroupId} from './RaftGroupId';
import {CPGroupCreateCPGroupCodec} from '../../codec/CPGroupCreateCPGroupCodec';
import {assertString} from '../../util/Util';

const DEFAULT_GROUP_NAME = 'default';

/** @internal */
export function withoutDefaultGroupName(name: string): string {
    assertString(name);
    name = name.trim();
    const i = name.indexOf('@');
    if (i === -1) {
        return name;
    }

    assert(name.indexOf('@', i + 1) === -1, 'Custom group name must be specified at most once');
    const groupName = name.slice(i + 1).trim();
    if (groupName === DEFAULT_GROUP_NAME) {
        return name.slice(0, i);
    }
    return name;
}

/** @internal */
export function getObjectNameForProxy(name: string): string {
    assertString(name);
    const i = name.indexOf('@');
    if (i === -1) {
        return name;
    }
    assert(i < (name.length - 1), 'Custom CP group name cannot be empty string');
    const objectName = name.slice(0, i).trim();
    assert(objectName.length > 0, 'Object name cannot be empty string');
    return objectName;
}

/** @internal */
export class CPProxyManager {

    public static readonly ATOMIC_LONG_SERVICE = 'hz:raft:atomicLongService';

    private readonly client: HazelcastClient;

    constructor(client: HazelcastClient) {
        this.client = client;
    }

    public getOrCreateProxy(proxyName: string, serviceName: string): Promise<DistributedObject> {
        proxyName = withoutDefaultGroupName(proxyName);
        const objectName = getObjectNameForProxy(proxyName);

        return this.getGroupId(proxyName).then((groupId) => {
            if (serviceName === CPProxyManager.ATOMIC_LONG_SERVICE) {
                return new AtomicLongProxy(this.client, groupId, proxyName, objectName);
            }
            throw new IllegalStateError('Unexpected service name: ' + serviceName);
        });
    }

    private getGroupId(proxyName: string): Promise<RaftGroupId> {
        const clientMessage = CPGroupCreateCPGroupCodec.encodeRequest(proxyName);
        return this.client.getInvocationService().invokeOnRandomTarget(clientMessage)
            .then((clientMessage) => {
                const response = CPGroupCreateCPGroupCodec.decodeResponse(clientMessage);
                return response.groupId;
            });
    }
}
