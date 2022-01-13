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
import {IAtomicReference} from '../IAtomicReference';
import {CPProxyManager} from './CPProxyManager';
import {RaftGroupId} from './RaftGroupId';
import {AtomicRefCompareAndSetCodec} from '../../codec/AtomicRefCompareAndSetCodec';
import {AtomicRefGetCodec} from '../../codec/AtomicRefGetCodec';
import {AtomicRefSetCodec} from '../../codec/AtomicRefSetCodec';
import {AtomicRefContainsCodec} from '../../codec/AtomicRefContainsCodec';
import {InvocationService} from '../../invocation/InvocationService';
import {SerializationService} from '../../serialization/SerializationService';


/** @internal */
export class AtomicRefProxy<E> extends BaseCPProxy implements IAtomicReference<E> {

    constructor(
        groupId: RaftGroupId,
        proxyName: string,
        objectName: string,
        invocationService: InvocationService,
        serializationService: SerializationService
    ) {
        super(
            CPProxyManager.ATOMIC_REF_SERVICE,
            groupId,
            proxyName,
            objectName,
            invocationService,
            serializationService
        );
    }

    compareAndSet(expect: E, update: E): Promise<boolean> {
        const expectedData = this.toData(expect);
        const newData = this.toData(update);
        return this.encodeInvokeOnRandomTarget(
            AtomicRefCompareAndSetCodec,
            AtomicRefCompareAndSetCodec.decodeResponse,
            this.groupId,
            this.objectName,
            expectedData,
            newData
        );
    }

    get(): Promise<E> {
        return this.encodeInvokeOnRandomTarget(
            AtomicRefGetCodec,
            (clientMessage) => {
                const response = AtomicRefGetCodec.decodeResponse(clientMessage);
                return this.toObject(response);
            },
            this.groupId,
            this.objectName
        );
    }

    set(newValue: E): Promise<void> {
        const newData = this.toData(newValue);
        return this.encodeInvokeOnRandomTarget(
            AtomicRefSetCodec,
            () => {},
            this.groupId,
            this.objectName,
            newData,
            false
        );
    }

    getAndSet(newValue: E): Promise<E> {
        const newData = this.toData(newValue);
        return this.encodeInvokeOnRandomTarget(
            AtomicRefSetCodec,
            (clientMessage) => {
                const response = AtomicRefSetCodec.decodeResponse(clientMessage);
                return this.toObject(response);
            },
            this.groupId,
            this.objectName,
            newData,
            true
        );
    }

    isNull(): Promise<boolean> {
        return this.contains(null);
    }

    clear(): Promise<void> {
        return this.set(null);
    }

    contains(value: E): Promise<boolean> {
        const valueData = this.toData(value);
        return this.encodeInvokeOnRandomTarget(
            AtomicRefContainsCodec,
            AtomicRefContainsCodec.decodeResponse,
            this.groupId,
            this.objectName,
            valueData
        );
    }
}
