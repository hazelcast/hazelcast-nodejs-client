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
exports.CountDownLatchProxy = void 0;
const BaseCPProxy_1 = require("./BaseCPProxy");
const CPProxyManager_1 = require("./CPProxyManager");
const Util_1 = require("../../util/Util");
const UuidUtil_1 = require("../../util/UuidUtil");
const CountDownLatchAwaitCodec_1 = require("../../codec/CountDownLatchAwaitCodec");
const CountDownLatchGetRoundCodec_1 = require("../../codec/CountDownLatchGetRoundCodec");
const CountDownLatchCountDownCodec_1 = require("../../codec/CountDownLatchCountDownCodec");
const CountDownLatchGetCountCodec_1 = require("../../codec/CountDownLatchGetCountCodec");
const CountDownLatchTrySetCountCodec_1 = require("../../codec/CountDownLatchTrySetCountCodec");
const core_1 = require("../../core");
/** @internal */
class CountDownLatchProxy extends BaseCPProxy_1.BaseCPProxy {
    constructor(groupId, proxyName, objectName, invocationService, serializationService) {
        super(CPProxyManager_1.CPProxyManager.LATCH_SERVICE, groupId, proxyName, objectName, invocationService, serializationService);
    }
    await(timeout) {
        (0, Util_1.assertNumber)(timeout);
        timeout = Math.max(0, timeout);
        const invocationUid = UuidUtil_1.UuidUtil.generate();
        return this.encodeInvokeOnRandomTarget(CountDownLatchAwaitCodec_1.CountDownLatchAwaitCodec, CountDownLatchAwaitCodec_1.CountDownLatchAwaitCodec.decodeResponse, this.groupId, this.objectName, invocationUid, timeout);
    }
    countDown() {
        const invocationUid = UuidUtil_1.UuidUtil.generate();
        return this.getRound()
            .then((round) => this.doCountDown(round, invocationUid));
    }
    doCountDown(round, invocationUid) {
        return this.requestCountDown(round, invocationUid)
            .catch((err) => {
            if (err instanceof core_1.OperationTimeoutError) {
                // we can retry safely because the retry is idempotent
                return this.doCountDown(round, invocationUid);
            }
            throw err;
        });
    }
    getRound() {
        return this.encodeInvokeOnRandomTarget(CountDownLatchGetRoundCodec_1.CountDownLatchGetRoundCodec, CountDownLatchGetRoundCodec_1.CountDownLatchGetRoundCodec.decodeResponse, this.groupId, this.objectName);
    }
    requestCountDown(round, invocationUid) {
        return this.encodeInvokeOnRandomTarget(CountDownLatchCountDownCodec_1.CountDownLatchCountDownCodec, () => { }, this.groupId, this.objectName, invocationUid, round);
    }
    getCount() {
        return this.encodeInvokeOnRandomTarget(CountDownLatchGetCountCodec_1.CountDownLatchGetCountCodec, CountDownLatchGetCountCodec_1.CountDownLatchGetCountCodec.decodeResponse, this.groupId, this.objectName);
    }
    trySetCount(count) {
        (0, Util_1.assertPositiveNumber)(count);
        return this.encodeInvokeOnRandomTarget(CountDownLatchTrySetCountCodec_1.CountDownLatchTrySetCountCodec, CountDownLatchTrySetCountCodec_1.CountDownLatchTrySetCountCodec.decodeResponse, this.groupId, this.objectName, count);
    }
}
exports.CountDownLatchProxy = CountDownLatchProxy;
//# sourceMappingURL=CountDownLatchProxy.js.map