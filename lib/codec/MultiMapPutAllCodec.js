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
exports.MultiMapPutAllCodec = void 0;
/* eslint-disable max-len */
const BitsUtil_1 = require("../util/BitsUtil");
const ClientMessage_1 = require("../protocol/ClientMessage");
const StringCodec_1 = require("./builtin/StringCodec");
const EntryListCodec_1 = require("./builtin/EntryListCodec");
const DataCodec_1 = require("./builtin/DataCodec");
const ListDataCodec_1 = require("./builtin/ListDataCodec");
// hex: 0x021700
const REQUEST_MESSAGE_TYPE = 136960;
// hex: 0x021701
// RESPONSE_MESSAGE_TYPE = 136961
const REQUEST_INITIAL_FRAME_SIZE = ClientMessage_1.PARTITION_ID_OFFSET + BitsUtil_1.BitsUtil.INT_SIZE_IN_BYTES;
/** @internal */
class MultiMapPutAllCodec {
    static encodeRequest(name, entries) {
        const clientMessage = ClientMessage_1.ClientMessage.createForEncode();
        clientMessage.setRetryable(false);
        clientMessage.setContainsSerializedDataInRequest(true);
        const initialFrame = ClientMessage_1.Frame.createInitialFrame(REQUEST_INITIAL_FRAME_SIZE);
        clientMessage.addFrame(initialFrame);
        clientMessage.setMessageType(REQUEST_MESSAGE_TYPE);
        clientMessage.setPartitionId(-1);
        StringCodec_1.StringCodec.encode(clientMessage, name);
        EntryListCodec_1.EntryListCodec.encode(clientMessage, entries, DataCodec_1.DataCodec.encode, ListDataCodec_1.ListDataCodec.encode);
        return clientMessage;
    }
}
exports.MultiMapPutAllCodec = MultiMapPutAllCodec;
//# sourceMappingURL=MultiMapPutAllCodec.js.map