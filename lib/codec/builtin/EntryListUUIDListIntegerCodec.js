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
exports.EntryListUUIDListIntegerCodec = void 0;
const ClientMessage_1 = require("../../protocol/ClientMessage");
const ListIntegerCodec_1 = require("./ListIntegerCodec");
const ListUUIDCodec_1 = require("./ListUUIDCodec");
const ListMultiFrameCodec_1 = require("./ListMultiFrameCodec");
/** @internal */
class EntryListUUIDListIntegerCodec {
    static encode(clientMessage, entries) {
        const entryCount = entries.length;
        const keys = new Array(entryCount);
        clientMessage.addFrame(ClientMessage_1.BEGIN_FRAME.copy());
        for (let i = 0; i < entryCount; i++) {
            keys[i] = entries[i][0];
            ListIntegerCodec_1.ListIntegerCodec.encode(clientMessage, entries[i][1]);
        }
        clientMessage.addFrame(ClientMessage_1.END_FRAME.copy());
        ListUUIDCodec_1.ListUUIDCodec.encode(clientMessage, keys);
    }
    static decode(clientMessage) {
        const values = ListMultiFrameCodec_1.ListMultiFrameCodec.decode(clientMessage, ListIntegerCodec_1.ListIntegerCodec.decode);
        const keys = ListUUIDCodec_1.ListUUIDCodec.decode(clientMessage);
        const result = new Array(keys.length);
        for (let i = 0; i < result.length; i++) {
            result[i] = [keys[i], values[i]];
        }
        return result;
    }
}
exports.EntryListUUIDListIntegerCodec = EntryListUUIDListIntegerCodec;
//# sourceMappingURL=EntryListUUIDListIntegerCodec.js.map