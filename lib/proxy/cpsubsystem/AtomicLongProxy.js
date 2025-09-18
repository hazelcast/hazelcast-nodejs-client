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
exports.AtomicLongProxy = void 0;
const Long = require("long");
const BaseCPProxy_1 = require("./BaseCPProxy");
const CPProxyManager_1 = require("./CPProxyManager");
const Util_1 = require("../../util/Util");
const AtomicLongAddAndGetCodec_1 = require("../../codec/AtomicLongAddAndGetCodec");
const AtomicLongCompareAndSetCodec_1 = require("../../codec/AtomicLongCompareAndSetCodec");
const AtomicLongGetCodec_1 = require("../../codec/AtomicLongGetCodec");
const AtomicLongGetAndAddCodec_1 = require("../../codec/AtomicLongGetAndAddCodec");
const AtomicLongGetAndSetCodec_1 = require("../../codec/AtomicLongGetAndSetCodec");
/** @internal */
class AtomicLongProxy extends BaseCPProxy_1.BaseCPProxy {
    constructor(groupId, proxyName, objectName, invocationService, serializationService) {
        super(CPProxyManager_1.CPProxyManager.ATOMIC_LONG_SERVICE, groupId, proxyName, objectName, invocationService, serializationService);
    }
    addAndGet(delta) {
        if (!Long.isLong(delta)) {
            (0, Util_1.assertNumber)(delta);
            delta = Long.fromNumber(delta);
        }
        return this.encodeInvokeOnRandomTarget(AtomicLongAddAndGetCodec_1.AtomicLongAddAndGetCodec, AtomicLongAddAndGetCodec_1.AtomicLongAddAndGetCodec.decodeResponse, this.groupId, this.objectName, delta);
    }
    compareAndSet(expect, update) {
        if (!Long.isLong(expect)) {
            (0, Util_1.assertNumber)(expect);
            expect = Long.fromNumber(expect);
        }
        if (!Long.isLong(update)) {
            (0, Util_1.assertNumber)(update);
            update = Long.fromNumber(update);
        }
        return this.encodeInvokeOnRandomTarget(AtomicLongCompareAndSetCodec_1.AtomicLongCompareAndSetCodec, AtomicLongCompareAndSetCodec_1.AtomicLongCompareAndSetCodec.decodeResponse, this.groupId, this.objectName, expect, update);
    }
    decrementAndGet() {
        return this.addAndGet(-1);
    }
    get() {
        return this.encodeInvokeOnRandomTarget(AtomicLongGetCodec_1.AtomicLongGetCodec, AtomicLongGetCodec_1.AtomicLongGetCodec.decodeResponse, this.groupId, this.objectName);
    }
    getAndAdd(delta) {
        if (!Long.isLong(delta)) {
            (0, Util_1.assertNumber)(delta);
            delta = Long.fromNumber(delta);
        }
        return this.encodeInvokeOnRandomTarget(AtomicLongGetAndAddCodec_1.AtomicLongGetAndAddCodec, AtomicLongGetAndAddCodec_1.AtomicLongGetAndAddCodec.decodeResponse, this.groupId, this.objectName, delta);
    }
    getAndDecrement() {
        return this.getAndAdd(-1);
    }
    getAndSet(newValue) {
        if (!Long.isLong(newValue)) {
            (0, Util_1.assertNumber)(newValue);
            newValue = Long.fromNumber(newValue);
        }
        return this.encodeInvokeOnRandomTarget(AtomicLongGetAndSetCodec_1.AtomicLongGetAndSetCodec, AtomicLongGetAndSetCodec_1.AtomicLongGetAndSetCodec.decodeResponse, this.groupId, this.objectName, newValue);
    }
    incrementAndGet() {
        return this.addAndGet(1);
    }
    getAndIncrement() {
        return this.getAndAdd(1);
    }
    set(newValue) {
        return this.getAndSet(newValue).then(() => { });
    }
}
exports.AtomicLongProxy = AtomicLongProxy;
//# sourceMappingURL=AtomicLongProxy.js.map