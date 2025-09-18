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
exports.EntryListIntegerLongCodec = void 0;
const BitsUtil_1 = require("../../util/BitsUtil");
const ClientMessage_1 = require("../../protocol/ClientMessage");
const FixSizedTypesCodec_1 = require("./FixSizedTypesCodec");
const ENTRY_SIZE_IN_BYTES = BitsUtil_1.BitsUtil.INT_SIZE_IN_BYTES + BitsUtil_1.BitsUtil.LONG_SIZE_IN_BYTES;
/** @internal */
class EntryListIntegerLongCodec {
    static encode(clientMessage, entries) {
        const entryCount = entries.length;
        const frame = new ClientMessage_1.Frame(Buffer.allocUnsafe(entryCount * ENTRY_SIZE_IN_BYTES));
        for (let i = 0; i < entryCount; i++) {
            FixSizedTypesCodec_1.FixSizedTypesCodec.encodeInt(frame.content, i * ENTRY_SIZE_IN_BYTES, entries[i][0]);
            FixSizedTypesCodec_1.FixSizedTypesCodec.encodeLong(frame.content, i * ENTRY_SIZE_IN_BYTES + BitsUtil_1.BitsUtil.INT_SIZE_IN_BYTES, entries[i][1]);
        }
        clientMessage.addFrame(frame);
    }
    static decode(clientMessage) {
        const frame = clientMessage.nextFrame();
        const entryCount = frame.content.length / ENTRY_SIZE_IN_BYTES;
        const result = new Array(entryCount);
        for (let i = 0; i < entryCount; i++) {
            const key = FixSizedTypesCodec_1.FixSizedTypesCodec.decodeInt(frame.content, i * ENTRY_SIZE_IN_BYTES);
            const value = FixSizedTypesCodec_1.FixSizedTypesCodec.decodeLong(frame.content, i * ENTRY_SIZE_IN_BYTES + BitsUtil_1.BitsUtil.INT_SIZE_IN_BYTES);
            result[i] = [key, value];
        }
        return result;
    }
}
exports.EntryListIntegerLongCodec = EntryListIntegerLongCodec;
//# sourceMappingURL=EntryListIntegerLongCodec.js.map