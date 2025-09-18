"use strict";
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
/** @ignore */ /** */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AtomicRefProxy = void 0;
const BaseCPProxy_1 = require("./BaseCPProxy");
const CPProxyManager_1 = require("./CPProxyManager");
const AtomicRefCompareAndSetCodec_1 = require("../../codec/AtomicRefCompareAndSetCodec");
const AtomicRefGetCodec_1 = require("../../codec/AtomicRefGetCodec");
const AtomicRefSetCodec_1 = require("../../codec/AtomicRefSetCodec");
const AtomicRefContainsCodec_1 = require("../../codec/AtomicRefContainsCodec");
const HazelcastError_1 = require("../../core/HazelcastError");
/** @internal */
class AtomicRefProxy extends BaseCPProxy_1.BaseCPProxy {
    constructor(groupId, proxyName, objectName, invocationService, serializationService) {
        super(CPProxyManager_1.CPProxyManager.ATOMIC_REF_SERVICE, groupId, proxyName, objectName, invocationService, serializationService);
    }
    compareAndSet(expect, update) {
        let expectedData, newData;
        try {
            expectedData = this.toData(expect);
            newData = this.toData(update);
        }
        catch (e) {
            if (e instanceof HazelcastError_1.SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.compareAndSet(expect, update));
            }
            throw e;
        }
        return this.encodeInvokeOnRandomTarget(AtomicRefCompareAndSetCodec_1.AtomicRefCompareAndSetCodec, AtomicRefCompareAndSetCodec_1.AtomicRefCompareAndSetCodec.decodeResponse, this.groupId, this.objectName, expectedData, newData);
    }
    get() {
        return this.encodeInvokeOnRandomTarget(AtomicRefGetCodec_1.AtomicRefGetCodec, (clientMessage) => {
            const response = AtomicRefGetCodec_1.AtomicRefGetCodec.decodeResponse(clientMessage);
            return this.toObject(response);
        }, this.groupId, this.objectName);
    }
    set(newValue) {
        let newData;
        try {
            newData = this.toData(newValue);
        }
        catch (e) {
            if (e instanceof HazelcastError_1.SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.set(newValue));
            }
            throw e;
        }
        return this.encodeInvokeOnRandomTarget(AtomicRefSetCodec_1.AtomicRefSetCodec, () => { }, this.groupId, this.objectName, newData, false);
    }
    getAndSet(newValue) {
        let newData;
        try {
            newData = this.toData(newValue);
        }
        catch (e) {
            if (e instanceof HazelcastError_1.SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.getAndSet(newValue));
            }
            throw e;
        }
        return this.encodeInvokeOnRandomTarget(AtomicRefSetCodec_1.AtomicRefSetCodec, (clientMessage) => {
            const response = AtomicRefSetCodec_1.AtomicRefSetCodec.decodeResponse(clientMessage);
            return this.toObject(response);
        }, this.groupId, this.objectName, newData, true);
    }
    isNull() {
        return this.contains(null);
    }
    clear() {
        return this.set(null);
    }
    contains(value) {
        let valueData;
        try {
            valueData = this.toData(value);
        }
        catch (e) {
            if (e instanceof HazelcastError_1.SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.contains(value));
            }
            throw e;
        }
        return this.encodeInvokeOnRandomTarget(AtomicRefContainsCodec_1.AtomicRefContainsCodec, AtomicRefContainsCodec_1.AtomicRefContainsCodec.decodeResponse, this.groupId, this.objectName, valueData);
    }
}
exports.AtomicRefProxy = AtomicRefProxy;
//# sourceMappingURL=AtomicRefProxy.js.map