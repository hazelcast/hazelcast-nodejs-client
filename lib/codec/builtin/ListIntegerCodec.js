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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListIntegerCodec = void 0;
const ClientMessage_1 = require("../../protocol/ClientMessage");
const BitsUtil_1 = require("../../util/BitsUtil");
const FixSizedTypesCodec_1 = require("./FixSizedTypesCodec");
/** @internal */
class ListIntegerCodec {
    static encode(clientMessage, list) {
        const itemCount = list.length;
        const frame = new ClientMessage_1.Frame(Buffer.allocUnsafe(itemCount * BitsUtil_1.BitsUtil.INT_SIZE_IN_BYTES));
        for (let i = 0; i < itemCount; i++) {
            FixSizedTypesCodec_1.FixSizedTypesCodec.encodeInt(frame.content, i * BitsUtil_1.BitsUtil.INT_SIZE_IN_BYTES, list[i]);
        }
        clientMessage.addFrame(frame);
    }
    static decode(clientMessage) {
        const frame = clientMessage.nextFrame();
        const itemCount = frame.content.length / BitsUtil_1.BitsUtil.INT_SIZE_IN_BYTES;
        const result = new Array(itemCount);
        for (let i = 0; i < itemCount; i++) {
            result[i] = FixSizedTypesCodec_1.FixSizedTypesCodec.decodeInt(frame.content, i * BitsUtil_1.BitsUtil.INT_SIZE_IN_BYTES);
        }
        return result;
    }
}
exports.ListIntegerCodec = ListIntegerCodec;
//# sourceMappingURL=ListIntegerCodec.js.map