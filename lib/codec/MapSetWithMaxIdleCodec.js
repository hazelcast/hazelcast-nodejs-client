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
exports.MapSetWithMaxIdleCodec = void 0;
/* eslint-disable max-len */
const BitsUtil_1 = require("../util/BitsUtil");
const FixSizedTypesCodec_1 = require("./builtin/FixSizedTypesCodec");
const ClientMessage_1 = require("../protocol/ClientMessage");
const StringCodec_1 = require("./builtin/StringCodec");
const DataCodec_1 = require("./builtin/DataCodec");
const CodecUtil_1 = require("./builtin/CodecUtil");
// hex: 0x014700
const REQUEST_MESSAGE_TYPE = 83712;
// hex: 0x014701
// RESPONSE_MESSAGE_TYPE = 83713
const REQUEST_THREAD_ID_OFFSET = ClientMessage_1.PARTITION_ID_OFFSET + BitsUtil_1.BitsUtil.INT_SIZE_IN_BYTES;
const REQUEST_TTL_OFFSET = REQUEST_THREAD_ID_OFFSET + BitsUtil_1.BitsUtil.LONG_SIZE_IN_BYTES;
const REQUEST_MAX_IDLE_OFFSET = REQUEST_TTL_OFFSET + BitsUtil_1.BitsUtil.LONG_SIZE_IN_BYTES;
const REQUEST_INITIAL_FRAME_SIZE = REQUEST_MAX_IDLE_OFFSET + BitsUtil_1.BitsUtil.LONG_SIZE_IN_BYTES;
/** @internal */
class MapSetWithMaxIdleCodec {
    static encodeRequest(name, key, value, threadId, ttl, maxIdle) {
        const clientMessage = ClientMessage_1.ClientMessage.createForEncode();
        clientMessage.setRetryable(false);
        clientMessage.setContainsSerializedDataInRequest(true);
        const initialFrame = ClientMessage_1.Frame.createInitialFrame(REQUEST_INITIAL_FRAME_SIZE);
        FixSizedTypesCodec_1.FixSizedTypesCodec.encodeLong(initialFrame.content, REQUEST_THREAD_ID_OFFSET, threadId);
        FixSizedTypesCodec_1.FixSizedTypesCodec.encodeLong(initialFrame.content, REQUEST_TTL_OFFSET, ttl);
        FixSizedTypesCodec_1.FixSizedTypesCodec.encodeLong(initialFrame.content, REQUEST_MAX_IDLE_OFFSET, maxIdle);
        clientMessage.addFrame(initialFrame);
        clientMessage.setMessageType(REQUEST_MESSAGE_TYPE);
        clientMessage.setPartitionId(-1);
        StringCodec_1.StringCodec.encode(clientMessage, name);
        DataCodec_1.DataCodec.encode(clientMessage, key);
        DataCodec_1.DataCodec.encode(clientMessage, value);
        return clientMessage;
    }
    static decodeResponse(clientMessage) {
        // empty initial frame
        clientMessage.nextFrame();
        return CodecUtil_1.CodecUtil.decodeNullable(clientMessage, DataCodec_1.DataCodec.decode);
    }
}
exports.MapSetWithMaxIdleCodec = MapSetWithMaxIdleCodec;
//# sourceMappingURL=MapSetWithMaxIdleCodec.js.map